const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

class OCRManager {
    constructor() {
        this.worker = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
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