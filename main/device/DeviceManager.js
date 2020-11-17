/* 
    This is the main Device Manager, to keep things consistent device commands should be filtered through here accordingly.
    You can just keep serial ports open and contiue to communicate over them. But, in my experience with other seialport libraries in Java
    closing the port and re-opening ensures that a device is not kept in the Window's registry unintentionally after a disconnection
    and the serial port enumeration continues to work as expected.
*/
const SerialPort = require( "serialport" );
const MyDevice = require('./my_device');
const CQueue = require('./CommandQueue');
const {default: PQueue} = require('p-queue');

function DeviceManager() {

    //cmdHandler is a Map {id: Cqueue} for managing incoming promises
    //this should prevent cross-talk and race cases.
    this.cmdHandler = {} 

    // helper function that will retrive all of the available serialports on Windows
    // the first two com ports tend to be reserved for the OS hardware.
    this.getPorts = function() {
        return new Promise((resolve, reject) => {
            let ports = [];

            SerialPort.list().then((results) => {
                results.forEach((port) => {
                    //e.g: COM4 on Windows, /dev/tty/look_it_up_yourself on linux
                    let com = port.path;
                    //Windows specific com parsing
                    let id = parseInt(com.slice(3));
                    if (id > 2) {
                        ports.push(com);
                        if (!this.cmdHandler[com]){
                            this.cmdHandler[com] = new PQueue({concurrency: 1});
                            this.cmdHandler[com].on('add', () => {
                                console.log(`Task Added.  Size: ${this.cmdHandler[com].size}  Pending: ${this.cmdHandler[com].pending}`);
                            });
                            // this.cmdHandler[com] = new CQueue();
                        }
                    }
                });

                //fine if there are no ports
                resolve(ports);
                
            }, err => { reject(Error("Error:", err)); });

        });
    };

    //retrieves the Serial Number and OEM info from all of the pods available.
    this.getDeviceInfo = async function (ports) {
        let pods = [];
        //pings all devices for information simultaneously
        await Promise.all(ports.map(async (port) => {
            await this.cmdHandler[port].add( async () => {
                let info = { com: port };
                let pod = new MyDevice(port);
                console.log("getting data from port: ", port);
                //grabs info from devices
                info['sn'] = await pod.getSn();
                console.log("data retrieved: ", info['sn']);
                //info['dist'] = await pod.getOEM();
                info['ledOn'] = false;
                pods.push(info);

                await pod.port.close();
            });
        })).catch(error => { 
            throw error
        });
        return pods;
    };

    //main runner for getting devices. gets device serial numbers
    //TODO: Run this in a task Scheduler pass to Redux
    this.getDevices = async function () {
        try {
            console.log("getting devices.");
            let pods = [];
            let ports = await this.getPorts();
            if (ports) {
                //testing ports with data retrieval ensures the device is connected
                pods = await this.getDeviceInfo(ports);
            }
            
            //Clean up device manager CQueues
            for (port in this.cmdHandler) {
                if (!ports.includes(port)) {
                    delete this.cmdHandler[port];
                }
            }

            //sort pods to ensure same behavior from promise.all return
            pods.sort(function (a, b) {
                let sn1 = a.sn;
                let sn2 = b.sn;
                return (sn1 < sn2) ? -1 : (sn1 > sn2) ? 1 : 0;
            });
            //TODO: ADD event handler to Redux Store instead - here maybe?
            return pods;
        }
        catch (err) {
            return Error(err);
        }
    };

    //checks foe a valid pod and then updates device's OEM
    this.updateDevice = async function (my_device, oem) {
        try {
            let valid_info = true;
            if (valid_info) {
                let device = new MyDevice(my_device.com);
                await device.setOEM(oem);
                await device.port.close();
            }
            else {
                throw Error("No valid licenses.");
            }
        }
        catch (err) {
            return Error(err);
        }
    };

    this.ledToggle = async function (my_device) {
        try {
            let device = new MyDevice(my_device.com);
            if (my_device.ledOn) {
               await this.cmdHandler[my_device.com].add(device.ledOff());
            }
            else {
               await this.cmdHandler[my_device.com].add(device.ledOn());
            }

            await device.port.close();
        }
        catch (err) {
            return Error(err);
        }
    };

    this.collectData = async function(my_device) {
        try{
            return await this.cmdHandler[my_device.com].add(async () => {
                let device = new MyDevice(my_device.com);
                let data = await device.collectData();
                console.log("Data resolved: ", data[0])
                console.log("Close? ", await device.port.close());
                return data[0];
            })
        } catch (err) {
            return Error(err);
        }
    }

    this.collectSpecial = async function(my_device) {
        try{
            let device = new MyDevice(my_device.com);
            let data = await this.cmdHandler[my_device.com].add(device.collectSpecial());
            await device.port.close();
            return data;
        } catch (err) {
            return Error(err);
        }
    }
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
  });

// process.on('error', function(err) {
//     console.log("Error: "+err);
// });

module.exports = DeviceManager;
