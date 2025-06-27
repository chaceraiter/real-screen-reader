const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

class RegionSelector {
    constructor() {
        this.selectorWindow = null;
        this.mainWindow = null;
        console.log('RegionSelector initialized');
    }

    async start() {
        console.log('Starting region selection...');
        
        // Store reference to the main window
        this.mainWindow = BrowserWindow.getFocusedWindow();
        if (!this.mainWindow) {
            console.error('No focused window found!');
            return;
        }
        console.log('Main window reference stored');
        
        const primaryDisplay = screen.getPrimaryDisplay();
        const { x, y, width, height } = primaryDisplay.workArea;
        console.log('Display info:', { x, y, width, height });

        try {
            // Create a transparent window that covers the entire screen
            this.selectorWindow = new BrowserWindow({
                width: width,
                height: height,
                x: x,
                y: y,
                transparent: true,
                frame: false,
                alwaysOnTop: true,
                skipTaskbar: true,
                resizable: false,
                movable: false,
                focusable: true,
                hasShadow: false,
                enableLargerThanScreen: true,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false,
                    backgroundThrottling: false,
                    offscreen: false
                },
                type: 'toolbar'  // This helps with transparency on Linux
            });
            console.log('Selector window created');

            // Ensure window is really on top
            this.selectorWindow.setAlwaysOnTop(true, 'screen-saver');
            this.selectorWindow.setVisibleOnAllWorkspaces(true);
            this.selectorWindow.setIgnoreMouseEvents(false);
            console.log('Window settings applied');

            // Load the selection HTML
            const selectorPath = path.join(__dirname, '../../../public/region-selector.html');
            await this.selectorWindow.loadFile(selectorPath);
            console.log('Region selector HTML loaded');
            
            // Handle window creation errors
            this.selectorWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                console.error('Failed to load region selector:', errorCode, errorDescription);
            });

            // Log when the window is ready
            this.selectorWindow.once('ready-to-show', () => {
                console.log('Region selector window ready to show');
            });
            
            // Handle selection complete
            ipcMain.once('selection-complete', (event, bounds) => {
                console.log('Selection complete received:', bounds);
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    // Adjust bounds to account for work area offset
                    const adjustedBounds = {
                        x: bounds.x + x,
                        y: bounds.y + y,
                        width: bounds.width,
                        height: bounds.height
                    };
                    console.log('Sending adjusted bounds to main window:', adjustedBounds);
                    this.mainWindow.webContents.send('region-selected', adjustedBounds);
                } else {
                    console.error('Main window not available for selection complete');
                }
                this.cleanup();
            });

            // Handle selection cancel
            ipcMain.once('selection-cancel', () => {
                console.log('Selection cancelled');
                this.cleanup();
            });

        } catch (error) {
            console.error('Error creating region selector window:', error);
            this.cleanup();
        }
    }

    cleanup() {
        console.log('Starting cleanup...');
        if (this.selectorWindow && !this.selectorWindow.isDestroyed()) {
            console.log('Closing selector window');
            this.selectorWindow.close();
        }
        this.selectorWindow = null;
        this.mainWindow = null;
        
        // Remove any lingering IPC listeners
        ipcMain.removeAllListeners('selection-complete');
        ipcMain.removeAllListeners('selection-cancel');
        console.log('Cleanup complete');
    }
}

module.exports = RegionSelector; 