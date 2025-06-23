const { app, BrowserWindow, ipcMain, desktopCapturer, screen } = require('electron');
const path = require('path');
const RegionSelector = require('./region-selector');
const ocrManager = require('./src/ocr');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const regionSelector = new RegionSelector();

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    frame: true,  // Keep the title bar
    autoHideMenuBar: true,  // Hide the menu bar
    resizable: false,  // Make it non-resizable
    titleBarStyle: 'hiddenInset',  // Minimal title bar
    backgroundColor: '#2f2f2f'  // Dark background
  });

  // Load the index.html file
  win.loadFile('index.html')
    .catch(e => console.error('Failed to load index.html:', e));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  // Handle start region selection request
  ipcMain.on('start-region-selection', async () => {
    await regionSelector.start();
  });

  // Handle get sources request
  ipcMain.handle('get-sources', async () => {
    try {
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: primaryDisplay.size.width,
          height: primaryDisplay.size.height
        }
      });
      return sources;
    } catch (error) {
      console.error('Error getting sources:', error);
      throw error;
    }
  });

  // Handle OCR request
  ipcMain.handle('perform-ocr', async (event, imagePath) => {
    try {
      const text = await ocrManager.recognizeText(imagePath);
      return { success: true, text };
    } catch (error) {
      console.error('OCR error:', error);
      return { success: false, error: error.message };
    }
  });
}

// This method will be called when Electron has finished initialization
app.whenReady()
  .then(async () => {
    // Check if we have a display
    if (!process.env.DISPLAY) {
      console.log('No display detected. Setting to :0');
      process.env.DISPLAY = ':0';
    }
    
    // Initialize OCR
    try {
      await ocrManager.initialize();
      console.log('OCR initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
    }
    
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
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
  // Cleanup OCR resources
  await ocrManager.terminate();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 