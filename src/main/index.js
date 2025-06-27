const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('path');
const RegionSelector = require('./window/region-selector');
const ocrManager = require('../ocr');
const ttsManager = require('./tts');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Disable GPU acceleration
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
app.commandLine.appendSwitch('use-gl', 'swiftshader');

// Set required environment variables
if (!process.env.DISPLAY) {
  process.env.DISPLAY = ':0';
}

const regionSelector = new RegionSelector();

function createWindow() {
  console.log('Creating main window...');
  
  // Create the browser window.
  const win = new BrowserWindow({
    width: 400,
    height: 200, // Reduced height to match new compact layout
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    frame: true,  // Keep the title bar
    autoHideMenuBar: true,  // Hide the menu bar
    resizable: false,  // Prevent resizing
    titleBarStyle: 'hiddenInset',  // Minimal title bar
    backgroundColor: '#2f2f2f',  // Dark background
    show: false  // Don't show until ready
  });

  // Show window when ready
  win.once('ready-to-show', () => {
    console.log('Window ready to show');
    win.show();
  });

  // Handle window errors
  win.webContents.on('crashed', (event) => {
    console.error('Window crashed:', event);
  });

  win.on('unresponsive', () => {
    console.error('Window became unresponsive');
  });

  // Load the index.html file
  const indexPath = path.join(__dirname, '../../public/index.html');
  win.loadFile(indexPath)
    .then(() => {
      console.log('index.html loaded successfully');
    })
    .catch(e => {
      console.error('Failed to load index.html:', e);
    });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
    console.log('DevTools opened in development mode');
  }

  // Handle start region selection request
  ipcMain.on('start-region-selection', async () => {
    console.log('Received start-region-selection request');
    await regionSelector.start();
  });

  // Handle get sources request
  ipcMain.handle('get-sources', async () => {
    try {
      console.log('Getting screen sources...');
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      
      console.log('Displays:', displays.map(d => ({
        id: d.id,
        bounds: d.bounds,
        workArea: d.workArea,
        scaleFactor: d.scaleFactor
      })));
      
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: primaryDisplay.size.width,
          height: primaryDisplay.size.height
        }
      });
      
      console.log('Got sources:', sources.map(s => ({
        id: s.id,
        name: s.name,
        thumbnailSize: s.thumbnail.getSize()
      })));
      
      return sources;
    } catch (error) {
      console.error('Error getting sources:', error);
      throw error;
    }
  });

  // Handle OCR request
  ipcMain.handle('perform-ocr', async (event, imagePath) => {
    try {
      console.log('Performing OCR on:', imagePath);
      const text = await ocrManager.recognizeText(imagePath);
      console.log('OCR result:', text.substring(0, 100) + '...');
      return { success: true, text };
    } catch (error) {
      console.error('OCR error:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle TTS request
  ipcMain.handle('speak-text', async (event, text) => {
    try {
      console.log('Synthesizing speech for text:', text.substring(0, 100) + '...');
      const audioData = await ttsManager.synthesize(text);
      console.log('Speech synthesis complete, audio data length:', audioData.length);
      return { success: true, audioData };
    } catch (error) {
      console.error('TTS error:', error);
      return { success: false, error: error.message };
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady()
  .then(async () => {
    console.log('Application ready, initializing...');
    
    // Initialize OCR and TTS
    try {
      console.log('Initializing OCR and TTS...');
      await Promise.all([
        ocrManager.initialize(),
        ttsManager.initialize()
      ]);
      console.log('OCR and TTS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        console.log('No windows found, creating new window');
        createWindow();
      }
    });
  })
  .catch(e => {
    console.error('Failed to initialize:', e);
    app.quit();
  });

// Quit when all windows are closed.
app.on('window-all-closed', async () => {
  console.log('All windows closed, cleaning up...');
  
  // Cleanup resources
  try {
    await Promise.all([
      ocrManager.terminate(),
      ttsManager.terminate()
    ]);
    console.log('Services terminated successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  
  if (process.platform !== 'darwin') {
    console.log('Quitting application');
    app.quit();
  }
}); 