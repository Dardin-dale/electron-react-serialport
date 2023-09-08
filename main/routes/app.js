const { app } = require('electron')

const routes = function() {
    /**
     * gets app version
     */
    ipcMain.handle('app/info', (_event) => {
        try {
            let version = app.getVersion();
            return version;
        } catch (err) {
            return err;
        }
    });

    ipcMain.handle('app/restart', (_event) => {
        app.relaunch();
        app.exit();
    })

    
}

module.exports = routes
