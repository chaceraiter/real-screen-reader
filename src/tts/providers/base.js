/**
 * Base TTS provider interface
 * All TTS providers must implement these methods
 */
class TTSProvider {
    constructor() {
        if (this.constructor === TTSProvider) {
            throw new Error('Cannot instantiate abstract class');
        }
    }

    /**
     * Initialize the provider
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new Error('Method not implemented');
    }

    /**
     * Synthesize text to speech
     * @param {string} text - The text to synthesize
     * @returns {Promise<ArrayBuffer>} - The audio data
     */
    async synthesize(text) {
        throw new Error('Method not implemented');
    }

    /**
     * Set the playback speed
     * @param {number} speed - The speed multiplier
     */
    setSpeed(speed) {
        throw new Error('Method not implemented');
    }

    /**
     * Set the voice to use
     * @param {Object} voice - The voice configuration
     */
    setVoice(voice) {
        throw new Error('Method not implemented');
    }

    /**
     * Stop current playback
     */
    stop() {
        throw new Error('Method not implemented');
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        throw new Error('Method not implemented');
    }
}

module.exports = TTSProvider; 