const fs = require('fs').promises;
const path = require('path');
const Voice = require('./models/voice');

class VoiceManager {
    constructor() {
        this.voicesDir = path.join(__dirname, 'voices');
        this.voices = new Map();
    }

    /**
     * Load available voice models from the voices directory
     */
    async loadVoiceModels() {
        try {
            const files = await fs.readdir(this.voicesDir);
            const voiceFiles = files.filter(file => file.endsWith('.onnx'));

            this.voices.clear();
            for (const file of voiceFiles) {
                const id = path.basename(file, '.onnx');
                const [lang, accent, quality] = id.split('-');
                
                // Create a readable name from the file
                const name = `${accent} (${quality})`;
                
                const voice = new Voice({
                    id,
                    name,
                    language: lang,
                    options: {
                        modelPath: path.join(this.voicesDir, file)
                    }
                });
                
                this.voices.set(id, voice);
            }

            return Array.from(this.voices.values());
        } catch (error) {
            console.error('Failed to load voice models:', error);
            throw error;
        }
    }

    /**
     * Get a voice model by ID
     * @param {string} id Voice model ID
     * @returns {Voice|undefined}
     */
    getVoice(id) {
        return this.voices.get(id);
    }

    /**
     * Get the path to a voice model file
     * @param {string} id Voice model ID
     * @returns {string|undefined}
     */
    getVoicePath(id) {
        const voice = this.voices.get(id);
        return voice?.options?.modelPath;
    }
}

module.exports = new VoiceManager(); 