const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const RegionSelector = require('./region-selector');

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
}

// This method will be called when Electron has finished initialization
app.whenReady()
  .then(() => {
    // Check if we have a display
    if (!process.env.DISPLAY) {
      console.log('No display detected. Setting to :0');
      process.env.DISPLAY = ':0';
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
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); 