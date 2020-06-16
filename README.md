# Electron-React-Serialport

**Clone and run for a quick way to see Electron in action.**

This is a minimal Electron application based on the [Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start) within the Electron documentation. 
This application uses React in combination with Electron for the serialport use case. I personally have had a lot of trial and error getting the npm serialport module to bundle nicely with Electron and React so I hope this helps. Making sure that the version of Node.js and Electron.js matches the version that serialport is compiled with is key. After importing the serialport I use electron-rebuild to ensure that the library is re-compiled to the correct Node.js version. I manually imported React and took the examples from the Electrate project. I found that create-react-app and yarn gave me additional trouble trying to get the serialport library to integrate. I've added webpack and babel to allow for most React/JSX compatibility and polyfill for ES6 Promises that are extremely useful for communicating with the serial device.

This is the bare version of the app that is mostly neutral on application development. For simpler application I prefer to directly use node integrations to talk to the serialport. For a more advanced application it is recommended to use ipc connections separating the main Electron Process from the renderer. The more advanced branch will use Redux to manage state in the renderer process and keep track of devices.

See branches:
`simple-app` - for a direct node integration example
`full-app` - for an ipc/redux capable application

**Use this app along with the [Electron API Demos](https://electronjs.org/#get-started) app for API code examples to help you get started.**

A basic Electron application needs just these files:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.

You can learn more about each of these components within the [Quick Start Guide](https://electronjs.org/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. Hoewever, Using a node version manager such as nvm is highly recommended for this project instead of installing Node.js directly.

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

Here are some structure notes

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
