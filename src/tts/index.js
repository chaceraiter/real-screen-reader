/**
 * Main TTS service interface
 * Handles text-to-speech conversion and playback
 */
const Speaker = require('speaker');

class TTSService {
    constructor() {
        this.currentProvider = null;
        this.isPlaying = false;
        this.speed = 1.0;
        this.currentVoice = null;
        this.currentSpeaker = null;
    }

    /**
     * Initialize the TTS service with a specific provider
     * @param {TTSProvider} provider - The TTS provider to use
     */
    async initialize(provider) {
        this.currentProvider = provider;
        await this.currentProvider.initialize();
    }

    /**
     * Convert text to speech and play it
     * @param {string} text - The text to speak
     * @returns {Promise<void>}
     */
    async speak(text) {
        if (!this.currentProvider) {
            throw new Error('TTS provider not initialized');
        }

        try {
            // Stop any current playback
            this.stop();

            // Get audio data from provider
            const audioData = await this.currentProvider.synthesize(text);

            // Initialize speaker with Piper's audio format
            this.currentSpeaker = new Speaker({
                channels: 1,           // mono
                bitDepth: 16,         // 16-bit
                sampleRate: 22050,    // sample rate for Piper
                signed: true          // signed
            });

            // Set up event handlers
            this.currentSpeaker.on('error', (err) => {
                console.error('Speaker error:', err);
                this.isPlaying = false;
                this.currentSpeaker = null;
            });

            this.currentSpeaker.on('close', () => {
                this.isPlaying = false;
                this.currentSpeaker = null;
            });

            // Play the audio
            this.isPlaying = true;
            this.currentSpeaker.write(audioData);
            this.currentSpeaker.end();

        } catch (error) {
            this.isPlaying = false;
            this.currentSpeaker = null;
            throw new Error(`Failed to play audio: ${error.message}`);
        }
    }

    /**
     * Set the playback speed
     * @param {number} speed - The speed multiplier (0.5 to 2.0)
     */
    setSpeed(speed) {
        this.speed = Math.max(0.5, Math.min(2.0, speed));
        if (this.currentProvider) {
            this.currentProvider.setSpeed(this.speed);
        }
    }

    /**
     * Set the voice to use
     * @param {Object} voice - The voice configuration
     */
    setVoice(voice) {
        this.currentVoice = voice;
        if (this.currentProvider) {
            this.currentProvider.setVoice(voice);
        }
    }

    /**
     * Stop current playback
     */
    stop() {
        if (this.currentSpeaker) {
            try {
                this.currentSpeaker.end();
            } catch (error) {
                console.error('Error stopping playback:', error);
            }
            this.currentSpeaker = null;
        }
        this.isPlaying = false;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        this.stop();
        if (this.currentProvider) {
            await this.currentProvider.cleanup();
        }
    }
}

module.exports = TTSService; 