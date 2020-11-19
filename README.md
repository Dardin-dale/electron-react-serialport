# Electron React SerialPort Boilerplate

## Installation

* use this template in a new repository
* `git clone https://github.com/you/your_repo.git`
* cd your_repo
* yarn install

rebuild serialport (should be run after installing new packages)

* yarn rebuild

Note: Before connecting your device, change the input in main/device/my_device.js
to use the serialnumber and LED on/off commands

* yarn start

## Packing for distribution

To package the app from windows platform:

 * yarn dist

## TODO

- [ ] HMR auto refresh/disable in prod
- [ ] Add cross platform installer scripts
- [ ] clean excess webpack config settings
- [ ] remove excess dependencies

### About

This application uses React in combination with Electron alongside the serialport npm package. I hope this helps. After importing the serialport library I use electron-rebuild to ensure that the library is re-compiled to the correct Node.js version. The install script ensures that electron-builder uses the correct prebuild.


## License

[CC0 1.0 (Public Domain)](LICENSE.md)
