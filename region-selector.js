const { BrowserWindow, ipcMain, screen } = require('electron');

class RegionSelector {
    constructor() {
        this.selectorWindow = null;
    }

    async start() {
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.bounds;

        // Create a transparent window that covers the entire screen
        this.selectorWindow = new BrowserWindow({
            width: width,
            height: height,
            x: 0,
            y: 0,
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
            this.selectorWindow.close();
            this.selectorWindow = null;
            // Emit the bounds back to the main window
            event.sender.send('region-selected', bounds);
        });

        // Handle selection cancel
        ipcMain.once('selection-cancel', () => {
            this.selectorWindow.close();
            this.selectorWindow = null;
        });
    }
}

module.exports = RegionSelector; 