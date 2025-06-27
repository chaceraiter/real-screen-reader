/**
 * Main TTS service interface
 * Handles text-to-speech conversion and playback
 */
const Speaker = require('speaker');
const PiperTTSProvider = require('./providers/piper');

class TTSManager {
    constructor() {
        this.provider = new PiperTTSProvider();
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await this.provider.initialize();
            this.isInitialized = true;
            console.log('TTS initialized successfully');
        } catch (error) {
            console.error('Error initializing TTS:', error);
            throw error;
        }
    }

    async synthesize(text) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const audioData = await this.provider.synthesize(text);
            
            // Create WAV header for the raw audio data
            const header = this.createWavHeader(22050, 16, 1, audioData.length);
            return Buffer.concat([header, audioData]);
        } catch (error) {
            console.error('Error during speech synthesis:', error);
            throw error;
        }
    }

    // Create WAV header for the raw audio data
    createWavHeader(sampleRate, bitsPerSample, channels, dataLength) {
        const buffer = Buffer.alloc(44);
        
        // RIFF chunk descriptor
        buffer.write('RIFF', 0);
        buffer.writeUInt32LE(36 + dataLength, 4);
        buffer.write('WAVE', 8);
        
        // fmt sub-chunk
        buffer.write('fmt ', 12);
        buffer.writeUInt32LE(16, 16); // fmt chunk size
        buffer.writeUInt16LE(1, 20); // audio format (PCM)
        buffer.writeUInt16LE(channels, 22);
        buffer.writeUInt32LE(sampleRate, 24);
        buffer.writeUInt32LE((sampleRate * channels * bitsPerSample) / 8, 28); // byte rate
        buffer.writeUInt16LE((channels * bitsPerSample) / 8, 32); // block align
        buffer.writeUInt16LE(bitsPerSample, 34);
        
        // data sub-chunk
        buffer.write('data', 36);
        buffer.writeUInt32LE(dataLength, 40);
        
        return buffer;
    }

    async terminate() {
        if (this.provider) {
            try {
                await this.provider.terminate();
            } catch (error) {
                console.error('Error terminating TTS provider:', error);
            }
            this.isInitialized = false;
        }
    }
}

module.exports = new TTSManager(); 