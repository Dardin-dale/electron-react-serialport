# Electron React SerialPort Boilerplate

## Installation

* use this template in a new repository
* `git clone https://github.com/you/your_repo.git`
* cd your_repo
* yarn install
* yarn rebuild
* yarn start

Note: Hot module replacement seems to not be working yet, use `yarn bundle:react` 
to apply your react changes.

## Packing for distribution

To package the app from windows platform:

`yarn dist`

## TODO

- [x] Fix HMR
- [ ] Add cross platform installer scripts
- [ ] clean excess webpack config

### About

This application uses React in combination with Electron alongside the serialport npm package. I personally have had a lot of trial and error getting the npm serialport module to bundle nicely with Electron and React so, I hope this helps. After importing the serialport library I use electron-rebuild to ensure that the library is re-compiled to the correct Node.js version.

manually adding

