# Real Screen Reader

A screen reader application built with Electron that provides text-to-speech functionality for selected screen regions.

## Quick Start

### Running the Main Application
1. Activate the conda environment:
   ```bash
   conda activate screen-reader
   ```

2. Start the application:
   ```bash
   ./scripts/start.sh
   ```

### Running the Audio Test Server
1. Activate the conda environment:
   ```bash
   conda activate screen-reader
   ```

2. Start the test server:
   ```bash
   npm run test-audio
   ```

3. Access the test interface:
   ```
   http://<vm-ip>:3000
   ```

## Project Structure

```
real-screen-reader/
├── src/                      # All source code
│   ├── main/                 # Main process code
│   │   ├── index.js         # Main entry point
│   │   ├── ocr/             # OCR-related code
│   │   ├── tts/             # TTS-related code
│   │   └── window/          # Window management code
│   ├── renderer/            # Renderer process code
│   │   ├── index.js         # Renderer entry point
│   │   ├── components/      # UI components
│   │   ├── styles/          # CSS files
│   │   └── utils/           # Renderer utilities
│   └── shared/              # Shared code between main and renderer
├── public/                  # Static assets
│   ├── index.html          # Main window HTML
│   └── styles/             # Global styles
├── build/                   # Build-related files
│   ├── icons/              # Application icons
│   └── scripts/            # Build scripts
├── tools/                   # Development tools
│   └── audio-test/         # Audio testing utility
├── docker/                  # Docker configuration
├── docs/                    # Documentation
├── scripts/                 # Installation and setup scripts
├── dist/                    # Build output
└── resources/              # Application resources
    ├── voices/             # TTS voice models
    └── eng.traineddata     # OCR language data
```

## Development Setup

### Prerequisites
- Node.js (v20 recommended)
- Conda environment named 'screen-reader'
- Linux with X11 (currently tested on Ubuntu)
- Tesseract.js (installed via npm)
- For Mac development:
  - Homebrew
  - PulseAudio (`brew install pulseaudio`)

### Initial Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd real-screen-reader
   ```

2. Create and activate conda environment:
   ```bash
   conda create -n screen-reader python=3.8
   conda activate screen-reader
   ```

3. Install dependencies:
   ```bash
   npm run setup
   ```

### Environment Variables
The application supports configuration through environment variables. You can set these in your shell or create a `.env` file in the project root:

```bash
# Conda configuration
CONDA_HOME=$HOME/miniconda        # Path to your conda installation
CONDA_ENV_NAME=screen-reader      # Name of the conda environment to use

# Display settings
DISPLAY=:0                        # X11 display to use
LIBGL_ALWAYS_SOFTWARE=1          # Force software rendering

# Application settings
OCR_LANG=eng                     # Default OCR language
TTS_ENGINE=system               # Text-to-speech engine to use
```

## Development Tools

### Audio Testing Utility
Located in `tools/audio-test/`, this utility helps test audio streaming from the VM to a browser on your host machine:

1. Features:
   - HTTP streaming for reliable cross-platform audio delivery
   - Browser-based test interface
   - Real-time file monitoring
   - Audio file playback

2. Usage:
   ```bash
   # From project root
   conda activate screen-reader
   npm run test-audio
   ```

3. Access:
   - Open `http://<vm-ip>:3000` in your browser
   - View and play generated audio files
   - Monitor new files as they're created

4. File Locations:
   - Generated audio: `/tmp/real-screen-reader-test/*.wav`
   - Test interface: `tools/audio-test/public/index.html`
   - Server code: `tools/audio-test/test-browser-stream.js`

## Data Flow

### Main Application Flow
1. User selects screen region
2. Region is captured as image
3. OCR extracts text from image
4. Text is sent to TTS engine
5. Audio is generated and saved
6. Audio is played through browser

### Audio Generation Flow
1. Text from OCR → TTS Manager
2. TTS Manager → Piper TTS Provider
3. Piper generates WAV audio
4. Audio saved to `/tmp/real-screen-reader-test/`
5. File available for playback via:
   - Direct browser playback
   - Audio test server streaming

For more detailed documentation, see:
- [Application Flow](docs/application-flow.md)
- [Audio Setup](docs/audio-setup.md)

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.