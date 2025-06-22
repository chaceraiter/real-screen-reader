const { desktopCapturer, ipcRenderer } = require('electron');

let isPlaying = false;
let speed = 1.0;

// Control buttons
document.getElementById('playBtn').addEventListener('click', () => {
    isPlaying = !isPlaying;
    const playBtn = document.getElementById('playBtn');
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    // TODO: Implement play/pause functionality
});

document.getElementById('stopBtn').addEventListener('click', () => {
    isPlaying = false;
    document.getElementById('playBtn').textContent = '▶';
    // TODO: Implement stop functionality
});

document.getElementById('slowBtn').addEventListener('click', () => {
    speed = Math.max(0.5, speed - 0.1);
    console.log('Speed:', speed.toFixed(1));
    // TODO: Implement speed change
});

document.getElementById('fastBtn').addEventListener('click', () => {
    speed = Math.min(2.0, speed + 0.1);
    console.log('Speed:', speed.toFixed(1));
    // TODO: Implement speed change
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    // TODO: Implement settings menu
    console.log('Settings clicked');
});

// Region selection
document.getElementById('selectRegion').addEventListener('click', async () => {
    try {
        // Start region selection
        ipcRenderer.send('start-region-selection');
    } catch (error) {
        console.error('Failed to start region selection:', error);
    }
});

// Handle selected region
ipcRenderer.on('region-selected', async (event, bounds) => {
    try {
        // Get all screens
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1920, height: 1080 }
        });

        // For now, just capture the primary screen
        const primaryScreen = sources[0];
        
        // Get the stream
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: primaryScreen.id,
                    // Use the selected region bounds
                    x: bounds.x,
                    y: bounds.y,
                    width: bounds.width,
                    height: bounds.height
                }
            }
        });

        // Create a video element to show the capture
        const video = document.createElement('video');
        video.srcObject = stream;
        video.style.width = '100%';
        video.style.maxHeight = '100px';
        video.style.marginTop = '10px';
        video.autoplay = true;
        
        // Add the video preview to the document
        const container = document.querySelector('.container');
        const existingVideo = container.querySelector('video');
        if (existingVideo) {
            container.removeChild(existingVideo);
        }
        container.appendChild(video);

        console.log('Region captured:', bounds);
    } catch (error) {
        console.error('Failed to capture region:', error);
    }
});

document.getElementById('startReading').addEventListener('click', function() {
    // TODO: Implement OCR and text-to-speech
    console.log('Reading started');
}); 