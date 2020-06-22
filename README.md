# Electron-React-Serialport

**Clone and run for a quick way to see Electron in action.**

[Quick Start Guide For Electron](https://electronjs.org/docs/tutorial/quick-start)

This application uses React in combination with Electron for the serialport use case. I personally have had a lot of trial and error getting the npm serialport module to bundle nicely with Electron and React so, I hope this helps. After importing the serialport library I use electron-rebuild to ensure that the library is re-compiled to the correct Node.js version. I manually imported React and took the examples from the [Electrate project](). I found that create-react-app and yarn gave me issues trying to troubleshoot getting the serialport library to integrate.

Chrome currently has a project that has access to serialport devices through the client side code. I have yet to test these features myself and have used the
serialport npm package for this project.

The main thing I've learned is that for native modules such as serialport is that they need to be compiled against the same version of Node.js as your version of Electron. Here you are trying to get Electron, Electron-rebuild (uses node-gyp), and Serialport to all play nice together and in the open source world one of these
projects will inevitably make an incompatible change and the others have to adapt. My first attempt at this in 2019 had many issues relating to electron-rebuild having an older version of node-gyp and my own version control problems. In that case I had to use the `npm install serialport --build-from-source` and hope for the best (not reccomended). So if you get a `bindings` error, try to take a close look at your version management first and then re-compile serialport.

Using a node version manager such as nvm is highly recommended for this project instead of installing Node.js directly.

I've added webpack and babel to allow for most React/JSX compatibility and polyfill for ES6 Promises that are extremely useful for communicating with the serial device.

This is the simple-app that is designed for quick one-page applications that don't need front-end state management. For a simpler application I prefer to directly use node integrations to talk to the serialport. For a more advanced application it is recommended to use ipc connections separating the main Electron Process from the renderer. The more advanced branch will use Redux to manage state in the renderer process and keep track of devices.

see /src/device to see how I manage devices - NOTE: This application is designed for Windows OS use in mind. If you use macOS or some debian distribution, slight changes will need to be made for the serialport enumeration (list) function in the device manager module.

See branches:
`master` - for a bare-bones install
`full-app` - for an ipc/redux capable application

**Use this app along with the [Electron API Demos](https://electronjs.org/#get-started) app for API code examples to help you get started.**

A basic Electron application needs just these files:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process** where react code is injected via `index.js`.

You can learn more about each of these components within the [Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. However, Using a node version manager such as nvm is highly recommended for this project instead of installing Node.js directly.

From your command line:

```bash
# Clone this repository
git clone https://github.com/Dardin-dale/electron-react-serialport
# Go into the repository
cd electron-quick-start
# Install dependencies
npm install
# Rebuild Serialport dependency
npm rebuild
# Run the app
npm start
# Build the distributable
npm run-script dist

```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Development

see /src/device to see how I manage devices

All of the code is run through the renderer process and the serialport code has access to Node through the nodeIntegration flag for the Electron Browser.

## Resources for Learning Electron

- [electronjs.org/docs](https://electronjs.org/docs) - all of Electron's documentation
- [electronjs.org/community#boilerplates](https://electronjs.org/community#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

[CC0 1.0 (Public Domain)](LICENSE.md)


## 
