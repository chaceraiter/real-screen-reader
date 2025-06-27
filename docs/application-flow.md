# Real Screen Reader: Application Flow Analysis

## Table of Contents
1. [Application Launch Flow](#1-application-launch-flow)
2. [Main Window Creation](#2-main-window-creation)
3. [Region Selection Flow](#3-region-selection-flow)
4. [OCR Flow](#4-ocr-flow)
5. [Text-to-Speech Flow](#5-text-to-speech-flow)
6. [File Management](#6-file-management)
7. [Error Handling and Logging](#7-error-handling-and-logging)
8. [Auxiliary/Vestigial Components](#auxiliaryvestigial-components)
9. [Potential Improvements/Issues](#potential-improvementsissues)

### 1. Application Launch Flow
1. `start.sh` script:
   - Sets up environment variables
   - Activates Conda environment
   - Sets display variables
   - Launches app with `npm run dev`

2. Electron initialization (`src/main/index.js`):
   - Loads required modules
   - Initializes services:
     - OCR Manager
     - TTS Manager
   - Creates main window
   - Sets up IPC handlers

### 2. Main Window Creation
1. Window configuration:
   - Size: 400x500
   - Dark theme
   - Node integration enabled
   - Fixed width

2. UI Elements (`public/index.html`):
   - Select Region button
   - Start Reading button (OCR)
   - Generate Speech button
   - Play Audio button
   - Preview container
   - Debug log container
   - OCR results container
   - Audio status container

### 3. Region Selection Flow
1. User clicks "Select Region":
   - Stops any existing capture
   - Sends `start-region-selection` to main process

2. Region Selector Window (`src/main/window/region-selector.js`):
   - Creates transparent fullscreen window
   - Loads region-selector.html
   - Handles mouse events for selection
   - Returns selected bounds to main process

3. Region Processing:
   - Gets screen sources
   - Captures selected region
   - Creates preview image
   - Updates UI with preview

### 4. OCR Flow
1. User clicks "Start Reading":
   - Disables buttons
   - Shows processing state

2. Image Processing:
   - Draws preview to canvas
   - Saves temporary PNG file
   - Sends to OCR service

3. OCR Service (`src/ocr.js`):
   - Uses Tesseract.js
   - Processes image
   - Returns recognized text
   - Updates UI with results

### 5. Text-to-Speech Flow
1. User clicks "Generate Speech":
   - Disables buttons
   - Shows processing state
   - Cleans up any existing audio resources

2. TTS Manager (`src/main/tts/index.js`):
   - Gets text from OCR results
   - Sends to TTS provider
   - Creates WAV header
   - Returns audio buffer
   - Saves audio file to `/tmp/real-screen-reader-test/`

3. Piper TTS Provider (`src/main/tts/providers/piper.js`):
   - Uses Python Piper library
   - Generates speech from text
   - Returns raw audio data
   - Supports future speed adjustment

4. Audio File Management:
   - Saves WAV file to `/tmp/real-screen-reader-test/`
   - Creates Blob URL for browser playback
   - Maintains file list for audio test server

5. Audio Playback:
   - User clicks "Play Audio" button
   - Browser loads audio via Blob URL
   - Plays through browser Audio API
   - Cleans up resources after playback
   - Optionally streams from test server

### 6. File Management
1. Temporary Files:
   - OCR frames: `/tmp/ocr-frame-{timestamp}.png`
   - TTS audio: `/tmp/real-screen-reader-test/tts-{timestamp}.wav`
   - TTS script: `/tmp/real-screen-reader-tts/synthesize.py`

2. Resources:
   - Voice models: `resources/voices/*.onnx`
   - OCR data: `resources/eng.traineddata`

3. Audio Test Files:
   - Location: `/tmp/real-screen-reader-test/`
   - Format: WAV files with proper headers
   - Naming: `tts-{timestamp}.wav`
   - Cleanup: Manual or on application restart

### 7. Error Handling and Logging
1. Comprehensive logging throughout:
   - Debug container in UI
   - Console logs
   - Error messages
   - Status updates
   - Audio generation status
   - Playback state

2. Error handling:
   - Service initialization
   - Region selection
   - OCR processing
   - TTS generation
   - Audio playback
   - File system operations
   - Resource cleanup

### Auxiliary/Vestigial Components

1. Audio Testing Tools (`tools/audio-test/`):
   - Browser-based audio streaming test
   - HTTP server for file streaming
   - File listing and playback interface
   - Real-time file monitoring
   - Part of development workflow

2. Development Scripts:
   - `dev.sh`: Development mode launcher
   - `setup.sh`: Initial setup script
   - `docker-compose.yml`: Container configuration (not actively used)

3. Build Configuration:
   - macOS specific settings in package.json
   - DMG configuration
   - Icon generation scripts

4. Unused Features:
   - TTS speed adjustment (commented in PiperTTSProvider)
   - Multiple voice support (infrastructure present but not implemented)
   - Docker support (files present but not actively used)

### Potential Improvements/Issues

1. File Organization:
   - Some files still in root directory
   - Inconsistent use of TypeScript/JavaScript
   - Mixed module systems (require/import)

2. Resource Management:
   - Voice models location inconsistency
   - Temporary file cleanup could be more robust
   - Resource paths could be centralized
   - Audio file management needs improvement

3. Error Handling:
   - Some error messages could be more user-friendly
   - Error recovery could be more graceful
   - Better handling of service failures
   - Audio playback error reporting

4. Performance:
   - OCR could be optimized for faster processing
   - Audio generation could be streamed
   - Region selection could be smoother
   - Audio caching for repeated text
   - Real-time streaming for longer texts 