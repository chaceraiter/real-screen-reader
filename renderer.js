const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

let isPlaying = false;
let speed = 1.0;
let currentStream = null;
let currentVideoTrack = null;

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
        document.querySelector('.preview-container').appendChild(debugContainer);
    }
    return debugContainer;
}

// Add debug log function
function debugLog(message, error = false) {
    const debugContainer = createDebugContainer();
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.style.color = error ? '#ff6b6b' : '#888';
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugContainer.appendChild(logEntry);
    debugContainer.scrollTop = debugContainer.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}

// Control buttons
document.getElementById('playBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('playBtn');
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    
    const video = document.querySelector('video');
    if (video) {
        if (isPlaying) {
            video.play();
        } else {
            video.pause();
        }
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
    
    const video = document.querySelector('video');
    if (video) {
        video.pause();
        video.currentTime = 0;
    }
});

document.getElementById('slowBtn').addEventListener('click', () => {
    speed = Math.max(0.5, speed - 0.1);
    updatePlaybackSpeed();
});

document.getElementById('fastBtn').addEventListener('click', () => {
    speed = Math.min(2.0, speed + 0.1);
    updatePlaybackSpeed();
});

function updatePlaybackSpeed() {
    const video = document.querySelector('video');
    if (video) {
        video.playbackRate = speed;
    }
    document.getElementById('speedDisplay').textContent = speed.toFixed(1) + 'x';
}

document.getElementById('settingsBtn').addEventListener('click', () => {
    // TODO: Implement settings menu
    console.log('Settings clicked');
});

// Region selection
document.getElementById('selectRegion').addEventListener('click', async () => {
    try {
        // Stop any existing capture
        if (currentVideoTrack) {
            currentVideoTrack.stop();
        }
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
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

        // Enable the start reading button
        const startReadingBtn = document.getElementById('startReading');
        startReadingBtn.disabled = false;

        debugLog('Region capture setup complete');
    } catch (error) {
        debugLog('Failed to capture region: ' + error.message, true);
        debugLog('Error stack: ' + error.stack, true);
        showError('Failed to capture selected region: ' + error.message);
    }
});

// Start reading (OCR) button
document.getElementById('startReading').addEventListener('click', async function() {
    try {
        debugLog('Starting OCR process');
        
        const preview = document.querySelector('.region-preview');
        const canvas = document.querySelector('canvas');
        
        debugLog('Preview element exists: ' + !!preview);
        debugLog('Canvas element exists: ' + !!canvas);
        
        if (!preview || !canvas) {
            throw new Error('Preview or canvas not found');
        }

        // Disable the button and show processing state
        const startReadingBtn = document.getElementById('startReading');
        startReadingBtn.disabled = true;
        startReadingBtn.textContent = 'Processing...';

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
        // Re-enable the button
        const startReadingBtn = document.getElementById('startReading');
        startReadingBtn.disabled = false;
        startReadingBtn.textContent = 'Start Reading';
    }
});

// Error handling
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
} 