require('dotenv').config()
// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
//assets get used from src which is included in webpack, build folder is for electron-builder's NSIS executable/installers
const icon = path.join(__dirname,'./icon.png');
const isDev = require('electron-is-dev');
const routes = require('./main/routes')
// const preload = require('')
let mainWindow



function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 420,
    height: 450,
    center:true,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: true,
      //Allows renderer to access IPCMain routes
      preload: path.join(__dirname, '/public/preload.js')
    }
  })

  mainWindow.setIcon(icon);

  // and load the index.html of the app.
  //mainWindow.loadFile(path.join(__dirname, '/index.html'))
  if (isDev) {
    mainWindow.loadURL('http://localhost:8082/')
  } else {
    mainWindow.loadURL(`file://${__dirname}/public/index.html`)
  }


  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

