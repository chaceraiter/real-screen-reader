const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

let currentStream = null;
let currentVideoTrack = null;
let currentAudioData = null;
let currentAudioUrl = null;
let currentAudio = null;

// Audio control state
let isPlaying = false;

// Constants
const isDevelopment = process.env.NODE_ENV === 'development';

// Add this function before initializeUI
function setupNewAudio(audioUrl, shouldAutoPlay = true) {
    // Cleanup existing audio
    if (currentAudio) {
        const wasPlaying = !currentAudio.paused;
        currentAudio.pause();
        currentAudio.src = '';
        currentAudio.remove();
        currentAudio = null;
        // Only update playing state if we're not going to autoplay
        if (!shouldAutoPlay) {
            isPlaying = false;
            updateAudioControlState();
        }
    }
    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
        currentAudioUrl = null;
    }
    
    // Create and setup new audio
    currentAudio = new Audio(audioUrl);
    currentAudioUrl = audioUrl;
    setupAudioEventListeners(currentAudio);
    
    // If autoplay is requested, we'll set isPlaying when playback actually starts
    // via the onplay event listener in setupAudioEventListeners
    
    return currentAudio;
}

// Initialize UI elements after DOM is ready
function initializeUI() {
    const audioControl = document.getElementById('audioControl');
    const voiceSelect = document.getElementById('voiceSelect');
    const selectRegion = document.getElementById('selectRegion');

    if (!audioControl || !voiceSelect || !selectRegion) {
        console.error('Required UI elements not found');
        return;
    }

    // Create debug log container
    function createDebugContainer() {
        let debugContainer = document.querySelector('.debug-log');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.className = 'debug-log';
            debugContainer.style.marginTop = '10px';
            debugContainer.style.padding = '10px';
            debugContainer.style.backgroundColor = '#1a1a1a';
            debugContainer.style.borderRadius = '4px';
            debugContainer.style.maxHeight = '150px';
            debugContainer.style.overflowY = 'auto';
            debugContainer.style.fontFamily = 'monospace';
            debugContainer.style.fontSize = '12px';
            debugContainer.style.whiteSpace = 'pre-wrap';
            debugContainer.style.wordBreak = 'break-all';
            const previewContainer = document.querySelector('.preview-container');
            if (previewContainer) {
                previewContainer.appendChild(debugContainer);
            } else {
                console.error('Preview container not found');
            }
        }
        return debugContainer;
    }

    // Add debug log function
    function debugLog(message, error = false) {
        const debugContainer = createDebugContainer();
        if (!debugContainer) return;
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.style.color = error ? '#ff6b6b' : '#888';
        logEntry.textContent = `[${timestamp}] ${message}`;
        debugContainer.appendChild(logEntry);
        debugContainer.scrollTop = debugContainer.scrollHeight;
        console.log(`[${timestamp}] ${message}`);
    }

    // Show error message
    function showError(message) {
        debugLog(message, true);
    }

    // Update audio control button state
    function updateAudioControlState() {
        const audioControl = document.getElementById('audioControl');
        if (audioControl) {
            if (isPlaying) {
                audioControl.textContent = '⏸'; // Larger pause symbol
            } else {
                audioControl.textContent = '▶'; // Larger play symbol
            }
            audioControl.disabled = !currentAudioData;
        }
    }

    // Handle audio control click
    audioControl.addEventListener('click', () => {
        if (!currentAudio) return;
        
        if (isPlaying) {
            currentAudio.pause();
        } else {
            currentAudio.play();
        }
        isPlaying = !isPlaying;
        updateAudioControlState();
    });

    // Handle audio events
    function setupAudioEventListeners(audio) {
        audio.onplay = () => {
            debugLog('Audio playback started');
            isPlaying = true;
            const audioControl = document.getElementById('audioControl');
            if (audioControl) {
                audioControl.disabled = false;
                updateAudioControlState();
            }
        };
        
        audio.onpause = () => {
            debugLog('Audio playback paused');
            isPlaying = false;
            updateAudioControlState();
        };
        
        audio.onended = () => {
            debugLog('Audio playback ended');
            isPlaying = false;
            const audioControl = document.getElementById('audioControl');
            if (audioControl) {
                audioControl.disabled = true;
                updateAudioControlState();
            }
        };

        audio.onerror = (error) => {
            debugLog('Audio playback error: ' + error.message, true);
            isPlaying = false;
            const audioControl = document.getElementById('audioControl');
            if (audioControl) {
                audioControl.disabled = true;
                updateAudioControlState();
            }
        };
    }

    // Populate voice models
    async function populateVoiceModels() {
        try {
            const voices = await ipcRenderer.invoke('get-voice-models');
            voiceSelect.innerHTML = ''; // Clear existing options
            
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.id;
                option.textContent = voice.name;
                voiceSelect.appendChild(option);
            });
        } catch (error) {
            debugLog('Failed to get voice models: ' + error.message, true);
            showError('Failed to load voice models');
        }
    }

    // Handle voice selection
    voiceSelect.addEventListener('change', async () => {
        const selectedVoice = voiceSelect.value;
        try {
            await ipcRenderer.invoke('set-voice-model', selectedVoice);
        } catch (error) {
            debugLog('Failed to set voice model: ' + error.message, true);
            showError('Failed to set voice model');
        }
    });

    // Initialize voice models
    populateVoiceModels();

    // Region selection
    selectRegion.addEventListener('click', async () => {
        try {
            debugLog('Starting region selection...');
            
            // Stop any existing capture and audio
            if (currentVideoTrack) {
                currentVideoTrack.stop();
            }
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (currentAudio) {
                currentAudio.pause();
                isPlaying = false;
                updateAudioControlState();
            }
            
            // Start region selection
            ipcRenderer.send('start-region-selection');
        } catch (error) {
            console.error('Failed to start region selection:', error);
            showError('Failed to start region selection');
        }
    });

    // Handle selected region
    ipcRenderer.on('region-selected', async (event, bounds) => {
        try {
            debugLog('Region selected: ' + JSON.stringify(bounds));
            
            // Get screen sources from main process
            debugLog('Requesting screen sources from main process');
            const sources = await ipcRenderer.invoke('get-sources');
            debugLog('Received ' + sources.length + ' screen sources');

            // For now, just capture the primary screen
            const primaryScreen = sources[0];
            if (!primaryScreen) {
                throw new Error('No screen source found');
            }

            debugLog('Using primary screen: ' + primaryScreen.id);

            // Create temporary canvas for cropping
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            
            // Set temp canvas size to match the full screenshot
            const fullImage = new Image();
            fullImage.src = primaryScreen.thumbnail.toDataURL();
            
            await new Promise((resolve, reject) => {
                fullImage.onload = resolve;
                fullImage.onerror = reject;
            });
            
            tempCanvas.width = fullImage.width;
            tempCanvas.height = fullImage.height;
            
            // Draw the full screenshot
            tempContext.drawImage(fullImage, 0, 0);
            
            // Calculate scale factor between actual screen and thumbnail
            const scaleX = fullImage.width / primaryScreen.thumbnail.getSize().width;
            const scaleY = fullImage.height / primaryScreen.thumbnail.getSize().height;
            
            // Scale the bounds
            const scaledBounds = {
                x: bounds.x * scaleX,
                y: bounds.y * scaleY,
                width: bounds.width * scaleX,
                height: bounds.height * scaleY
            };
            
            debugLog(`Scaled bounds: ${JSON.stringify(scaledBounds)}`);

            // Create or update canvas for OCR
            let canvas = document.querySelector('canvas');
            if (!canvas) {
                canvas = document.createElement('canvas');
                canvas.style.display = 'none';
                document.body.appendChild(canvas);
                debugLog('Created new canvas element');
            }

            // Set canvas dimensions to match region
            canvas.width = bounds.width;
            canvas.height = bounds.height;
            debugLog(`Canvas dimensions set to: ${bounds.width}x${bounds.height}`);

            // Create preview container
            const container = document.querySelector('.preview-container');
            
            // Create preview image
            let preview = document.querySelector('.region-preview');
            if (!preview) {
                preview = document.createElement('img');
                preview.className = 'region-preview';
                preview.style.backgroundColor = '#000';
                container.appendChild(preview);
                debugLog('Created new preview image element');
            }

            // Crop the region from the full screenshot
            const regionData = tempContext.getImageData(
                scaledBounds.x,
                scaledBounds.y,
                scaledBounds.width,
                scaledBounds.height
            );
            
            // Put the cropped region on the main canvas
            canvas.width = scaledBounds.width;
            canvas.height = scaledBounds.height;
            const context = canvas.getContext('2d');
            context.putImageData(regionData, 0, 0);

            // Update preview with the cropped region
            preview.src = canvas.toDataURL();
            debugLog('Updated preview image with cropped region');

            // Save canvas to temporary file and process
            const tempFile = await new Promise((resolve, reject) => {
                canvas.toBlob(async (blob) => {
                    try {
                        const buffer = await blob.arrayBuffer();
                        const tempPath = path.join(os.tmpdir(), `ocr-${Date.now()}.png`);
                        fs.writeFileSync(tempPath, Buffer.from(buffer));
                        resolve(tempPath);
                    } catch (error) {
                        reject(error);
                    }
                });
            });

            try {
                // Perform OCR silently
                debugLog('Starting OCR process on temporary file');
                const result = await ipcRenderer.invoke('perform-ocr', tempFile);
                debugLog('OCR completed with result: ' + JSON.stringify(result));
                
                if (result.success && result.text.trim()) {
                    // Generate and play speech if text was detected
                    debugLog('Automatically generating speech');
                    const speechResult = await ipcRenderer.invoke('speak-text', result.text);
                    
                    if (speechResult.success) {
                        // Create audio blob and setup new audio
                        const audioBlob = new Blob([speechResult.audioData], { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audio = setupNewAudio(audioUrl);
                        debugLog('Attempting to play audio...');
                        audio.play()
                            .then(() => {
                                debugLog('Audio playback started successfully');
                            })
                            .catch(error => {
                                debugLog('Audio playback failed: ' + error.message, true);
                                showError('Audio playback failed - you may need to interact with the page first');
                            });
                    } else {
                        throw new Error(speechResult.error || 'Speech generation failed');
                    }
                } else if (!result.success) {
                    throw new Error(result.error || 'OCR failed');
                }
            } finally {
                // Cleanup temporary file
                try {
                    fs.unlinkSync(tempFile);
                    debugLog('Cleaned up temporary file');
                } catch (e) {
                    debugLog('Failed to cleanup temporary file: ' + e.message, true);
                }
            }

            debugLog('Region capture setup complete');
        } catch (error) {
            debugLog('Failed to capture region: ' + error.message, true);
            debugLog('Error stack: ' + error.stack, true);
            showError('Failed to capture selected region: ' + error.message);
        }
    });
}

// Initialize UI when DOM is ready
initializeUI();

// Recognize Text button
document.getElementById('recognizeText').addEventListener('click', async function() {
    try {
        debugLog('Starting OCR process');
        
        const preview = document.querySelector('.region-preview');
        const canvas = document.querySelector('canvas');
        
        debugLog('Preview element exists: ' + !!preview);
        debugLog('Canvas element exists: ' + !!canvas);
        
        if (!preview || !canvas) {
            throw new Error('Preview or canvas not found');
        }

        // Disable buttons and show processing state
        const recognizeTextBtn = document.getElementById('recognizeText');
        const generateSpeechBtn = document.getElementById('generateSpeech');
        const playAudioBtn = document.getElementById('playAudio');
        
        recognizeTextBtn.disabled = true;
        generateSpeechBtn.disabled = true;
        playAudioBtn.disabled = true;
        recognizeTextBtn.textContent = 'Processing...';

        // Create status element if it doesn't exist
        let statusElement = document.querySelector('.ocr-status');
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.className = 'ocr-status';
            statusElement.style.marginTop = '10px';
            statusElement.style.padding = '5px';
            statusElement.style.backgroundColor = '#2d2d2d';
            statusElement.style.borderRadius = '4px';
            statusElement.style.textAlign = 'center';
            document.querySelector('.preview-container').appendChild(statusElement);
        }
        statusElement.textContent = 'Processing image...';

        // Draw the preview image to canvas
        const context = canvas.getContext('2d');
        debugLog(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
        debugLog(`Preview dimensions: ${preview.naturalWidth}x${preview.naturalHeight}`);
        
        context.drawImage(preview, 0, 0, canvas.width, canvas.height);
        debugLog('Drew preview image to canvas');

        // Save the frame as a temporary file
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `ocr-frame-${Date.now()}.png`);
        debugLog('Saving image to: ' + tempFile);

        // Convert canvas to blob and save to file
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!blob) {
            throw new Error('Failed to create image blob');
        }
        debugLog('Created image blob: ' + blob.size + ' bytes');

        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(tempFile, buffer);
        debugLog('Saved image to temporary file');

        try {
            // Perform OCR
            statusElement.textContent = 'Performing OCR...';
            debugLog('Starting OCR process on temporary file');
            const result = await ipcRenderer.invoke('perform-ocr', tempFile);
            debugLog('OCR completed with result: ' + JSON.stringify(result));
            
            if (result.success) {
                // Create or update results container
                let resultsContainer = document.querySelector('.ocr-results');
                if (!resultsContainer) {
                    resultsContainer = document.createElement('div');
                    resultsContainer.className = 'ocr-results';
                    resultsContainer.style.marginTop = '10px';
                    resultsContainer.style.padding = '10px';
                    resultsContainer.style.backgroundColor = '#3f3f3f';
                    resultsContainer.style.borderRadius = '4px';
                    resultsContainer.style.maxHeight = '150px';
                    resultsContainer.style.overflowY = 'auto';
                    document.querySelector('.preview-container').appendChild(resultsContainer);
                }

                // Update results
                resultsContainer.textContent = result.text || 'No text detected';
                statusElement.textContent = result.text.trim() ? 'OCR completed!' : 'No text detected in the image';
                debugLog('Updated results container with OCR text');

                // Enable generate speech if text was detected
                generateSpeechBtn.disabled = !result.text.trim();
                playAudioBtn.disabled = true;

                // Clear any existing audio data
                if (currentAudioUrl) {
                    URL.revokeObjectURL(currentAudioUrl);
                }
                currentAudioData = null;
                currentAudioUrl = null;
                if (currentAudio) {
                    currentAudio.pause();
                    currentAudio = null;
                }
            } else {
                throw new Error(result.error || 'OCR failed');
            }
        } finally {
            // Cleanup temporary file
            try {
                fs.unlinkSync(tempFile);
                debugLog('Cleaned up temporary file');
            } catch (e) {
                debugLog('Failed to cleanup temporary file: ' + e.message, true);
            }
        }
    } catch (error) {
        debugLog('Failed to start reading: ' + error.message, true);
        debugLog('Error stack: ' + error.stack, true);
        showError('Failed to start reading: ' + error.message);
        
        // Update status on error
        const statusElement = document.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = 'Error: ' + error.message;
            statusElement.style.color = '#ff6b6b';
        }
    } finally {
        recognizeTextBtn.disabled = false;
        recognizeTextBtn.textContent = 'Recognize Text';
    }
});

// Generate Speech button
document.getElementById('generateSpeech').addEventListener('click', async function() {
    try {
        const resultsContainer = document.querySelector('.ocr-results');
        if (!resultsContainer) {
            throw new Error('No text available to synthesize');
        }

        const text = resultsContainer.textContent;
        if (!text.trim()) {
            throw new Error('No text available to synthesize');
        }

        // Disable buttons and show processing state
        const generateSpeechBtn = document.getElementById('generateSpeech');
        const playAudioBtn = document.getElementById('playAudio');
        generateSpeechBtn.disabled = true;
        playAudioBtn.disabled = true;
        generateSpeechBtn.textContent = 'Generating...';

        // Update status
        let statusElement = document.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = 'Generating speech...';
            statusElement.style.color = '';
        }

        // Clear any existing audio data
        if (currentAudioUrl) {
            URL.revokeObjectURL(currentAudioUrl);
        }
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        // Request speech synthesis
        debugLog('Requesting speech synthesis');
        const result = await ipcRenderer.invoke('speak-text', text);
        
        if (result.success) {
            // Store the audio data
            currentAudioData = result.audioData;
            
            // Create new blob and URL for browser playback
            const blob = new Blob([currentAudioData], { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(blob);
            setupNewAudio(audioUrl);
            
            // Only save to test directory in development mode
            if (isDevelopment) {
                const testDir = path.join(os.tmpdir(), 'real-screen-reader-test');
                if (!fs.existsSync(testDir)) {
                    fs.mkdirSync(testDir, { recursive: true });
                }
                const timestamp = Date.now();
                const audioFile = path.join(testDir, `tts-${timestamp}.wav`);
                fs.writeFileSync(audioFile, Buffer.from(currentAudioData));
                debugLog(`Saved audio file for testing: ${audioFile}`);
            }

            // Enable play button
            playAudioBtn.disabled = false;
            
            if (statusElement) {
                statusElement.textContent = 'Speech generated successfully';
            }
        } else {
            throw new Error(result.error || 'Failed to generate speech');
        }
    } catch (error) {
        console.error('Failed to generate speech:', error);
        showError('Failed to generate speech: ' + error.message);
        
        let statusElement = document.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = 'Error generating speech';
            statusElement.style.color = '#ff6b6b';
        }
    } finally {
        const generateSpeechBtn = document.getElementById('generateSpeech');
        generateSpeechBtn.disabled = false;
        generateSpeechBtn.textContent = 'Generate Speech';
    }
});

// Play Audio button
document.getElementById('playAudio').addEventListener('click', async function() {
    try {
        if (!currentAudioUrl) {
            throw new Error('No audio available to play');
        }

        const playAudioBtn = document.getElementById('playAudio');
        playAudioBtn.disabled = true;
        
        // Use existing audio if available, or create new one
        if (!currentAudio) {
            setupNewAudio(currentAudioUrl);
        }

        currentAudio.onended = () => {
            playAudioBtn.disabled = false;
            let statusElement = document.querySelector('.ocr-status');
            if (statusElement) {
                statusElement.textContent = 'Playback completed';
            }
        };

        // Start playback
        let statusElement = document.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = 'Playing audio...';
        }
        await currentAudio.play();
        debugLog('Started audio playback');
    } catch (error) {
        console.error('Failed to play audio:', error);
        showError('Failed to play audio: ' + error.message);
        
        let statusElement = document.querySelector('.ocr-status');
        if (statusElement) {
            statusElement.textContent = 'Error playing audio';
            statusElement.style.color = '#ff6b6b';
        }
        
        const playAudioBtn = document.getElementById('playAudio');
        playAudioBtn.disabled = false;
    }
});

// Cleanup function for when window is closed
window.addEventListener('beforeunload', () => {
    // Clean up audio resources
    if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
    }
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    currentAudioData = null;
}); 