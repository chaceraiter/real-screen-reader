const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

class OCRManager {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
        this.trainedDataPath = path.join(__dirname, '..', 'resources', 'eng.traineddata');
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Check if trained data exists
            if (!fs.existsSync(this.trainedDataPath)) {
                console.error('OCR trained data not found at:', this.trainedDataPath);
                console.log('Current directory:', __dirname);
                console.log('Absolute path:', path.resolve(this.trainedDataPath));
                throw new Error('OCR trained data not found at: ' + this.trainedDataPath);
            }

            console.log('Initializing OCR with trained data at:', this.trainedDataPath);
            // Create worker with language specified directly
            this.worker = await createWorker('eng');
            this.isInitialized = true;
            console.log('OCR initialized successfully');
        } catch (error) {
            console.error('Error initializing OCR:', error);
            throw error;
        }
    }

    async recognizeText(imagePath) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const result = await this.worker.recognize(imagePath);
            return result.data.text;
        } catch (error) {
            console.error('Error during OCR:', error);
            throw error;
        }
    }

    async terminate() {
        if (this.worker) {
            try {
                await this.worker.terminate();
            } catch (error) {
                console.error('Error terminating OCR worker:', error);
            }
            this.worker = null;
            this.isInitialized = false;
        }
    }
}

module.exports = new OCRManager(); 