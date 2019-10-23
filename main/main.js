const {app, BrowserWindow} = require('electron');
const SerialPort = require('serialport');

function createWindow () {   
  // Create the browser window.     
  win = new BrowserWindow({width: 800, height: 600}); 
  win.loadURL('http://localhost:3000/');

}
// and load the index.html of the app.     win.loadFile('index.html')   }      
app.on('ready', createWindow);