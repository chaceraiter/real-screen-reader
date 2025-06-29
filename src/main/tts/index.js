/**
 * Main TTS service interface
 * Handles text-to-speech conversion and playback
 */
const Speaker = require('speaker');
const PiperTTSProvider = require('./providers/piper');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Constants
const MAX_TEST_FILES = 10;
const isDevelopment = process.env.NODE_ENV === 'development';

class TTSManager {
    constructor() {
        this.provider = new PiperTTSProvider();
        this.isInitialized = false;
        this.testDir = path.join(os.tmpdir(), 'real-screen-reader-test');
        this.speaker = null;
        console.log('TTS Manager initialized with test directory:', this.testDir);
        
        // Ensure test directory exists in development mode
        if (isDevelopment && !fs.existsSync(this.testDir)) {
            console.log('Creating test directory...');
            fs.mkdirSync(this.testDir, { recursive: true });
        }
    }

    async cleanupOldTestFiles() {
        if (!isDevelopment) return;

        try {
            const files = fs.readdirSync(this.testDir)
                .filter(file => file.endsWith('.wav'))
                .map(file => ({
                    name: file,
                    path: path.join(this.testDir, file),
                    time: fs.statSync(path.join(this.testDir, file)).mtime.getTime()
                }))
                .sort((a, b) => b.time - a.time); // Sort by newest first

            // Remove old files if we exceed the limit
            if (files.length > MAX_TEST_FILES) {
                const filesToRemove = files.slice(MAX_TEST_FILES);
                for (const file of filesToRemove) {
                    fs.unlinkSync(file.path);
                    console.log('Removed old test file:', file.name);
                }
            }
        } catch (error) {
            console.error('Error cleaning up old test files:', error);
        }
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await this.provider.initialize();
            this.isInitialized = true;
            console.log('TTS Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TTS:', error);
            throw error;
        }
    }

    async speak(text) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            console.log('Starting synthesis for text:', text.substring(0, 50) + '...');
            const audioData = await this.provider.synthesize(text);
            console.log('Got audio data, length:', audioData.length);
            
            // Create WAV header for the raw audio data
            const header = this.createWavHeader(22050, 16, 1, audioData.length);
            const wavData = Buffer.concat([header, audioData]);
            
            // Create a new speaker for this playback
            this.speaker = new Speaker({
                channels: 1,           // mono
                bitDepth: 16,         // 16-bit
                sampleRate: 22050,    // sample rate for Piper
                signed: true          // signed
            });

            // Play the audio
            this.speaker.write(wavData);
            this.speaker.end();
            
            return { success: true };
        } catch (error) {
            console.error('Error during speech synthesis:', error);
            return { success: false, error: error.message };
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
                await this.provider.cleanup();
            } catch (error) {
                console.error('Error terminating TTS provider:', error);
            }
            this.isInitialized = false;
        }
    }
}

module.exports = new TTSManager(); 