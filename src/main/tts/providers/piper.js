const TTSProvider = require('./base');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

/**
 * Piper TTS provider implementation
 */
class PiperTTSProvider extends TTSProvider {
    constructor() {
        super();
        this.initialized = false;
        this.currentSpeed = 1.0;
        this.currentVoice = null;
        this.pythonProcess = null;
        this.tempDir = path.join(os.tmpdir(), 'real-screen-reader-tts');
        this.voiceModelPath = path.join(__dirname, '..', 'voices', 'en_US-ljspeech-high.onnx');
        this.scriptFile = path.join(this.tempDir, 'synthesize.py');
    }

    /**
     * Get the model name from the voice model path
     * @returns {string} The model name without extension
     */
    getModelName() {
        const basename = path.basename(this.voiceModelPath);
        return basename.replace('.onnx', '');
    }

    async initialize() {
        try {
            // Create temp directory if it doesn't exist
            await fs.mkdir(this.tempDir, { recursive: true });
            
            // Check if voice model exists
            try {
                await fs.access(this.voiceModelPath);
            } catch (error) {
                throw new Error(`Voice model not found at ${this.voiceModelPath}`);
            }
            
            // Create the Python script that uses Piper TTS
            const pythonScript = `
from piper import PiperVoice
import sys
import os
import numpy as np

text = sys.argv[1]
model_path = sys.argv[2]
output_path = sys.argv[3]

# Initialize Piper with our local voice model
voice = PiperVoice.load(model_path)

# Synthesize speech and save to file
audio_data = voice.synthesize_stream_raw(text)
with open(output_path, 'wb') as f:
    for chunk in audio_data:
        f.write(chunk)
            `.trim();

            await fs.writeFile(this.scriptFile, pythonScript);
            
            // Test Piper availability by running a simple command
            await new Promise((resolve, reject) => {
                const process = spawn('python', ['-c', 'from piper import PiperVoice']);
                
                process.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error('Failed to initialize Piper TTS'));
                    }
                });

                process.on('error', (err) => {
                    reject(err);
                });
            });

            this.initialized = true;
            console.log('Piper TTS initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Piper TTS:', error);
            throw error;
        }
    }

    async synthesize(text) {
        if (!this.initialized) {
            throw new Error('Provider not initialized');
        }

        try {
            // Create a unique filename with model name and timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const modelName = this.getModelName();
            const outputPath = path.join(this.tempDir, `tts-${modelName}-${timestamp}.wav`);

            // Run the Python script to generate audio file
            await new Promise((resolve, reject) => {
                const process = spawn('python', [this.scriptFile, text, this.voiceModelPath, outputPath]);
                
                let errorOutput = '';
                process.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                    console.error(`TTS Error: ${data}`);
                });

                process.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        reject(new Error(`TTS synthesis failed: ${errorOutput}`));
                    }
                });

                process.on('error', (err) => {
                    reject(err);
                });
            });

            // Read the generated audio file
            const audioData = await fs.readFile(outputPath);
            return audioData;
        } catch (error) {
            console.error('Failed to synthesize speech:', error);
            throw error;
        }
    }

    setSpeed(speed) {
        this.currentSpeed = speed;
        // Note: Speed adjustment will be implemented in a future update
    }

    async cleanup() {
        try {
            await fs.rm(this.tempDir, { recursive: true, force: true });
            this.initialized = false;
        } catch (error) {
            console.error('Failed to clean up TTS temporary files:', error);
        }
    }
}

module.exports = PiperTTSProvider; 