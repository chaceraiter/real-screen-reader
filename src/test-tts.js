const PiperTTSProvider = require('./tts/providers/piper');
const Speaker = require('speaker');

async function testTTS() {
    try {
        console.log('Initializing TTS provider...');
        const provider = new PiperTTSProvider();
        await provider.initialize();

        console.log('Synthesizing test speech...');
        const text = 'This is a test of the Piper text to speech system.';
        const audioData = await provider.synthesize(text);

        // Play the audio directly
        const speaker = new Speaker({
            channels: 1,           // mono
            bitDepth: 16,         // 16-bit
            sampleRate: 22050,    // sample rate for Piper
            signed: true          // signed
        });

        speaker.write(audioData);
        speaker.end();

        // Clean up
        await provider.cleanup();
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testTTS(); 