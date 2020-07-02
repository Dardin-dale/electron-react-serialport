// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const path = require('path')
//assets get used from src which is included in webpack, build folder is for electron-builder's NSIS executable/installers
const icon = path.join(__dirname,'assets/icon.png');
const isDev = require('electron-is-dev');

const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 420,
    height: 450,
    center:true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      //prevents users from looking with chrome dev tools.
      //devTools: false,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.setIcon(icon);

  // and load the index.html of the app.
  //mainWindow.loadFile(path.join(__dirname, '/index.html'))
  mainWindow.loadURL(url.format({
    pathname:path.join(__dirname,'/build/index.html'),
    protocol:'file:'
  }));


  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

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


// Use this code to test if you can get ES6 features to work
// async function asyncTest () {
//   let test = await myAsyncfunc();
//   console.log(test);
// }

// async function myAsyncfunc () {
//   return new Promise(resolve => {
//       setTimeout(resolve("async/await now runs"), 1000);
//   })
// }