const TTSService = require('./tts');
const PiperTTSProvider = require('./tts/providers/piper');

async function quickTest() {
    const service = new TTSService();
    const provider = new PiperTTSProvider();

    try {
        await service.initialize(provider);
        console.log('Speaking test sentence...');
        await service.speak('Welcome to the screen reader project. How does this voice sound to you?');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for playback to finish
        await service.cleanup();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

quickTest(); 