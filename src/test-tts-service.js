const TTSService = require('./tts');
const PiperTTSProvider = require('./tts/providers/piper');

async function testTTSService() {
    const service = new TTSService();
    const provider = new PiperTTSProvider();

    try {
        console.log('1. Initializing TTS service with Piper provider...');
        await service.initialize(provider);
        console.log('✓ Service initialized');

        // Test basic speech
        console.log('\n2. Testing basic speech...');
        await service.speak('This is a test of the TTS service with Piper.');
        console.log('✓ Basic speech completed');

        // Wait a moment before next test
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test interruption
        console.log('\n3. Testing speech interruption...');
        service.speak('This is a long sentence that should be interrupted by the next speech command.')
            .catch(err => {
                if (err.message.includes('Failed to play audio')) {
                    console.log('✓ Expected error from interrupted speech');
                } else {
                    console.error('Unexpected error:', err);
                }
            });
        
        // Wait briefly before interrupting
        await new Promise(resolve => setTimeout(resolve, 500));
        await service.speak('Interrupting previous speech.');
        console.log('✓ Speech interruption test completed');

        // Test speed changes
        console.log('\n4. Testing different speech speeds...');
        service.setSpeed(1.5); // Faster
        await service.speak('This should be spoken at a faster speed.');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        service.setSpeed(0.8); // Slower
        await service.speak('And this should be spoken more slowly.');
        console.log('✓ Speed tests completed');

        // Test stop functionality
        console.log('\n5. Testing stop functionality...');
        service.speak('This speech should be stopped mid-way.');
        await new Promise(resolve => setTimeout(resolve, 500));
        service.stop();
        console.log('✓ Stop functionality test completed');

        // Final test
        console.log('\n6. Final test with cleanup...');
        await service.speak('This is the final test before cleanup.');
        await service.cleanup();
        console.log('✓ Final test and cleanup completed');

        console.log('\nAll tests completed successfully! 🎉');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Ensure cleanup happens even if tests fail
        try {
            await service.cleanup();
        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }
}

// Run the tests
console.log('Starting TTS Service tests...\n');
testTTSService(); 