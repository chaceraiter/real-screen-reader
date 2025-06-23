const { BrowserWindow, ipcMain, screen } = require('electron');

class RegionSelector {
    constructor() {
        this.selectorWindow = null;
        this.mainWindow = null;
    }

    async start() {
        // Store reference to the main window
        this.mainWindow = BrowserWindow.getFocusedWindow();
        
        const primaryDisplay = screen.getPrimaryDisplay();
        const { x, y, width, height } = primaryDisplay.workArea;

        // Create a transparent window that covers the entire screen
        this.selectorWindow = new BrowserWindow({
            width: width,
            height: height,
            x: x,
            y: y,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // Load the selection HTML
        await this.selectorWindow.loadFile('region-selector.html');
        
        // Handle selection complete
        ipcMain.once('selection-complete', (event, bounds) => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                // Adjust bounds to account for work area offset
                const adjustedBounds = {
                    x: bounds.x + x,
                    y: bounds.y + y,
                    width: bounds.width,
                    height: bounds.height
                };
                this.mainWindow.webContents.send('region-selected', adjustedBounds);
                console.log('Region selected:', adjustedBounds);
            }
            this.cleanup();
        });

        // Handle selection cancel
        ipcMain.once('selection-cancel', () => {
            console.log('Region selection cancelled');
            this.cleanup();
        });
    }

    cleanup() {
        if (this.selectorWindow && !this.selectorWindow.isDestroyed()) {
            this.selectorWindow.close();
        }
        this.selectorWindow = null;
        this.mainWindow = null;
    }
}

module.exports = RegionSelector; 