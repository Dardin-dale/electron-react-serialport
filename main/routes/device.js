const DeviceManager = require('../device/DeviceManager');
const deviceManager = DeviceManager.getInstance()

/**
 *
 */
const routes = function() {
    //gets devices from device manager
    ipcMain.handle('get-devices', async(_event) => {
      const result = await deviceManager.getDevices();
      return result;
    });

    //toggles LED on for given device
    ipcMain.handle('led-on', async(_event, device) => {
      try {
        await deviceManager.ledOn(device);
        return true
      } catch (err) {
        return false;
      }

    });

    //toggles LED on for given device
    ipcMain.handle('led-off', async(_event, device) => {
      try {
        await deviceManager.ledOff(device);
        return true;
      } catch (err) {
        return false;
      }

    });
}

module.exports = routes;
