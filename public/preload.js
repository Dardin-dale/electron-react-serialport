const { ipcRenderer, contextBridge } = require("electron")


contextBridge.exposeInMainWorld("myAPI", {
    appInfo: () => ipcRenderer.invoke('app/info'),
    restart: () => ipcRenderer.invoke('app/restart'),
    getDevices: () => ipcRenderer.invoke('device/get-devices'),
    ledOn: (port) => ipcRenderer.invoke('device/led-on', port),
    ledOff: (port) => ipcRenderer.invoke('device/led-off', port)
});
