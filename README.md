# Real Screen Reader

A standalone screen reader application built with Electron that can capture and read text from any screen region. This project was originally started with Tauri but has been migrated to Electron for better screen capture capabilities and cross-platform compatibility.

> **Note**: The original Tauri-based implementation has been archived and can be found at [real-screen-reader-tauri](https://github.com/your-username/real-screen-reader-tauri).

## Project Overview

Real Screen Reader is designed to be a lightweight, efficient tool for reading text from any part of your screen. Key features include:
- Region selection with visual feedback
- Real-time screen capture
- OCR text extraction using Tesseract.js
- Natural text-to-speech (planned)
- Customizable reading preferences (planned)

## Current State

The application currently supports:
- Basic Electron window management
- Transparent window overlays for region selection
- Screen region selection with visual feedback
- Real-time preview of captured regions
- Basic OCR functionality using Tesseract.js
- Proper coordinate handling for multi-monitor setups
- Window dragging and basic window controls

### Recent Progress
- Migrated from Tauri to Electron for better screen capture support
- Implemented accurate region selection with proper coordinate handling
- Added OCR capabilities with Tesseract.js integration
- Fixed window dragging issues and coordinate offsets
- Created robust startup script with environment handling

## Development Setup

### Prerequisites
- Node.js (v20 recommended)
- Conda environment named 'screen-reader'
- Linux with X11 (currently tested on Ubuntu)
- Tesseract.js (installed via npm)

### Environment Variables
The application supports configuration through environment variables. You can set these in your shell or create a `.env` file in the project root:

```bash
# Conda configuration
CONDA_HOME=$HOME/miniconda        # Path to your conda installation
CONDA_ENV_NAME=screen-reader      # Name of the conda environment to use

# Display settings
DISPLAY=:0                        # X11 display to use
LIBGL_ALWAYS_SOFTWARE=1          # Force software rendering

# Application settings (future use)
OCR_LANG=eng                     # Default OCR language
TTS_ENGINE=system               # Text-to-speech engine to use
```

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

3. Create and activate conda environment:
   ```bash
   conda create -n screen-reader python=3.8
   conda activate screen-reader
   ```

4. Start the application:
   ```bash
   ./start.sh
   ```

## Project Structure
```
real-screen-reader/
├── main.js              # Electron main process
├── renderer.js          # Electron renderer process
├── region-selector.js   # Region selection functionality
├── index.html          # Main application window
├── styles.css          # Application styles
├── start.sh           # Application startup script
└── src/
    └── ocr.js         # OCR functionality
```

## For AI Agents

### Project Context
This project aims to create a screen reader that's more flexible and user-friendly than traditional screen readers. The key differentiator is the ability to select and read specific regions of the screen rather than entire elements or windows.

### Technical Decisions
1. **Electron vs Tauri**: Migrated from Tauri to Electron due to:
   - More mature screen capture APIs
   - Better documentation and community support
   - Easier integration with native features
   - Better support for transparent windows and region selection

2. **Architecture**:
   - Main process (`main.js`) handles window management and IPC
   - Renderer process (`renderer.js`) manages UI and user interactions
   - Region selector runs in a separate transparent window
   - OCR processing handled in a dedicated module

3. **Coordinate System**:
   - Uses screen's work area to handle system UI elements
   - Accounts for multi-monitor setups
   - Properly scales coordinates between different contexts

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
   - Test with different monitor configurations

### Current Challenges
1. **OCR Accuracy**:
   - Need to improve text recognition accuracy
   - Consider preprocessing steps for better results
   - Handle different text colors and backgrounds

2. **Performance**:
   - Optimize screen capture frequency
   - Reduce memory usage during continuous capture
   - Handle large regions efficiently

3. **UI Improvements**:
   - Add more window controls (minimize, maximize)
   - Improve region selection visual feedback
   - Add keyboard shortcuts for common actions

### Next Steps
1. **OCR Enhancements**:
   - Add image preprocessing options
   - Implement text post-processing
   - Add support for different languages
   - Optimize OCR performance

2. **Text-to-Speech**:
   - Research and select TTS engine
   - Implement voice selection
   - Add reading speed controls
   - Support natural-sounding pronunciation
   - Handle different languages

3. **User Experience**:
   - Add keyboard shortcuts
   - Implement region presets/favorites
   - Create settings panel
   - Add progress indicators
   - Improve error handling and user feedback

4. **Performance Optimization**:
   - Implement caching for frequently read regions
   - Optimize screen capture
   - Add batch processing for multiple regions
   - Improve memory management

## Contributing
Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 