# Real Screen Reader

A standalone screen reader application built with Electron that can capture and read text from any screen region. This project was originally started with Tauri but has been migrated to Electron for better screen capture capabilities and cross-platform compatibility.

> **Note**: The original Tauri-based implementation has been archived and can be found at [real-screen-reader-tauri](https://github.com/your-username/real-screen-reader-tauri).

## Project Overview

Real Screen Reader is designed to be a lightweight, efficient tool for reading text from any part of your screen. Key features include:
- Region selection with visual feedback
- Real-time screen capture
- OCR text extraction (planned)
- Natural text-to-speech (planned)
- Customizable reading preferences (planned)

## Current State

The application currently supports:
- Basic Electron window management
- Transparent window overlays
- Screen region selection with visual feedback
- Real-time preview of captured regions

## Development Setup

### Prerequisites
- Node.js (v20 recommended)
- Conda environment named 'screen-reader'
- Linux with X11 (currently tested on Ubuntu)

### Environment Variables
The application requires specific environment variables for proper functionality:
- `DISPLAY=:0` - For X11 display access
- `LIBGL_ALWAYS_SOFTWARE=1` - For software rendering support

### Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd real-screen-reader
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the setup script:
   ```bash
   ./setup.sh
   ```

4. Start the application:
   ```bash
   npm run dev
   ```

## Project Structure
```
real-screen-reader/
├── main.js           # Electron main process
├── renderer.js       # Electron renderer process
├── region-selector.js # Region selection functionality
├── index.html        # Main application window
├── styles.css        # Application styles
└── setup.sh         # Environment setup script
```

## For AI Agents

### Project Context
This project aims to create a screen reader that's more flexible and user-friendly than traditional screen readers. The key differentiator is the ability to select and read specific regions of the screen rather than entire elements or windows.

### Technical Decisions
1. **Electron vs Tauri**: Migrated from Tauri to Electron due to:
   - More mature screen capture APIs
   - Better documentation and community support
   - Easier integration with native features

2. **Architecture**:
   - Main process (`main.js`) handles window management and IPC
   - Renderer process (`renderer.js`) manages UI and user interactions
   - Region selector runs in a separate transparent window

### Development Guidelines
1. **Code Style**:
   - Use modern JavaScript/TypeScript features
   - Maintain clear separation between main and renderer processes
   - Document IPC communication patterns
   - Add comments for complex logic

2. **UI/UX Principles**:
   - Keep the interface minimal and non-intrusive
   - Provide clear visual feedback for user actions
   - Ensure accessibility in the UI itself
   - Use consistent styling defined in `styles.css`

3. **Testing Considerations**:
   - Test on different Linux distributions
   - Verify screen capture in various scenarios
   - Check memory usage during extended sessions
   - Validate accessibility features

### Next Steps
1. **OCR Integration**:
   - Research and select OCR library
   - Implement text extraction from captured regions
   - Add text preprocessing for better accuracy

2. **Text-to-Speech**:
   - Evaluate TTS engines
   - Implement voice selection
   - Add reading speed controls
   - Support natural-sounding pronunciation

3. **User Experience**:
   - Add keyboard shortcuts
   - Implement region presets
   - Create settings panel
   - Add progress indicators

4. **Performance**:
   - Optimize screen capture
   - Minimize memory usage
   - Reduce CPU load during idle

## Contributing
Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 