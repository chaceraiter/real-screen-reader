# Audio Setup and Testing Guide

## Overview
The Real Screen Reader uses a browser-based audio streaming approach for reliable audio playback across different environments. This method streams generated audio files from the VM to any browser, making it work seamlessly regardless of the host system's audio configuration.

## Architecture

### Components
1. **TTS Engine (Piper)**
   - Runs in the VM
   - Generates WAV audio files
   - Saves files to `/tmp/real-screen-reader-test/`

2. **Audio Test Server**
   - Express.js-based HTTP server
   - Serves audio files via HTTP streaming
   - Provides browser-based interface
   - Located in `tools/audio-test/`

3. **Browser Interface**
   - Lists available audio files
   - Provides playback controls
   - Uses browser's native audio capabilities
   - Located at `tools/audio-test/public/index.html`

## File Flow
1. Text Recognition:
   ```
   Screen Region → OCR → Text
   ```

2. Audio Generation:
   ```
   Text → Piper TTS → WAV File in /tmp/real-screen-reader-test/
   ```

3. Audio Delivery:
   ```
   WAV File → HTTP Server → Browser → Playback
   ```

## Setup and Testing

### 1. Prerequisites
- Node.js (installed via conda environment)
- Express.js (`npm install express`)
- Piper TTS (included in conda environment)
- Modern web browser

### 2. Starting the Application Stack
1. Start the audio test server:
   ```bash
   # Important: Activate the conda environment and run the server in the same command
   conda activate screen-reader && npm run test-audio
   ```

2. In another terminal, launch the main application:
   ```bash
   ./scripts/start.sh
   ```

Important Notes:
- Always run conda activation and npm commands in the same command string (using &&)
- The main application and audio server must run in separate terminals
- The start.sh script handles conda activation automatically
- All commands must be run from the project root directory

### 3. Accessing the Audio Interface
1. Open the test interface in your browser:
   ```
   http://<vm-ip>:3000
   ```

2. You should see:
   - List of generated audio files
   - Playback controls for each file
   - File information (size, creation time)

## Troubleshooting

### Common Issues
1. **No Audio Files Listed**
   - Check if files exist in `/tmp/real-screen-reader-test/`
   - Verify file permissions
   - Ensure test server is running

2. **Cannot Access Test Page**
   - Verify server is running
   - Check VM IP address
   - Ensure port 3000 is accessible

3. **Audio Won't Play**
   - Check browser console for errors
   - Verify WAV file format is correct
   - Try a different browser

### Debugging
1. Server logs are available in the terminal running `npm run test-audio`
2. Browser console will show playback-related errors
3. Check application logs for TTS generation issues

## Future Improvements
1. WebSocket-based real-time streaming
2. Audio format options (MP3, Opus)
3. Caching for frequently used audio
4. Progress indicators for long text
5. Queue system for multiple segments 