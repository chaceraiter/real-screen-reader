/**
 * Voice configuration model
 */
class Voice {
    /**
     * @param {Object} config - Voice configuration
     * @param {string} config.id - Unique identifier for the voice
     * @param {string} config.name - Display name for the voice
     * @param {string} config.language - Language code (e.g., 'en-US')
     * @param {Object} [config.options={}] - Additional provider-specific options
     */
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.language = config.language;
        this.options = config.options || {};
    }

    /**
     * Create a voice instance from a configuration object
     * @param {Object} config - Voice configuration
     * @returns {Voice}
     */
    static fromConfig(config) {
        return new Voice(config);
    }

    /**
     * Get the voice configuration as a plain object
     * @returns {Object}
     */
    toConfig() {
        return {
            id: this.id,
            name: this.name,
            language: this.language,
            options: this.options
        };
    }
}

module.exports = Voice; 