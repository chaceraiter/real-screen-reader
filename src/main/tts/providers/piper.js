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
        this.voiceModelPath = path.join(__dirname, '..', 'voices', 'en_US-lessac-medium.onnx');
        this.scriptFile = path.join(this.tempDir, 'synthesize.py');
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

# Initialize Piper with our local voice model
voice = PiperVoice.load(model_path)

# Synthesize speech and get raw audio data
for audio_chunk in voice.synthesize_stream_raw(text):
    sys.stdout.buffer.write(audio_chunk)
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
            // Run the Python script and collect audio data
            const audioChunks = [];
            await new Promise((resolve, reject) => {
                const process = spawn('python', [this.scriptFile, text, this.voiceModelPath]);
                
                process.stdout.on('data', (data) => {
                    audioChunks.push(data);
                });

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

            // Combine audio chunks into a single buffer
            return Buffer.concat(audioChunks);
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