# Real Screen Reader

A standalone screen reader application built with Electron that can capture and read text from any screen region.

## Project Roadmap

### Phase 1: Core Infrastructure
- [x] Set up Electron application structure
- [x] Configure Docker development environment
- [x] Basic UI implementation
- [ ] Screen capture functionality
- [ ] Region selection implementation

### Phase 2: Text Processing
- [ ] Implement OCR capabilities (Tesseract.js)
- [ ] Text preprocessing and cleanup
- [ ] Language detection
- [ ] Text segmentation for natural reading

### Phase 3: Speech Synthesis
- [ ] Integrate text-to-speech engine
- [ ] Voice selection options
- [ ] Speed control implementation
- [ ] Reading progress tracking

### Phase 4: Advanced Features
- [ ] Custom region presets
- [ ] Keyboard shortcuts
- [ ] Auto-update for dynamic content
- [ ] Export capabilities (text/audio)

### Phase 5: Polish & Distribution
- [ ] Error handling and recovery
- [ ] Performance optimization
- [ ] Application packaging
- [ ] Auto-updater implementation

## Development Setup

### Prerequisites
- Docker
- Docker Compose
- X11 (Linux)

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd real-screen-reader
   ```

2. Start the development environment:
   ```bash
   ./dev.sh
   ```

This will:
- Build the Docker container with all dependencies
- Mount the necessary X11 and audio sockets
- Start the Electron application in development mode

### Development Container Features
- Isolated development environment
- Automatic dependency management
- X11 forwarding for GUI
- Audio passthrough
- Hot reload support
- Hardware acceleration enabled

### Project Structure
```
real-screen-reader/
├── main.js           # Electron main process
├── renderer.js       # Electron renderer process
├── index.html        # Main application window
├── styles.css        # Application styles
├── Dockerfile        # Development container definition
├── docker-compose.yml# Container orchestration
└── dev.sh           # Development startup script
```

## Contributing
1. All development should be done within the Docker container
2. Use the provided dev.sh script to ensure consistent environment
3. Follow the existing code style
4. Test thoroughly before submitting changes

## License
MIT 