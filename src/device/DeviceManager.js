/* 
    This is the main Device Manager, to keep things consistent device commands should be filtered through here accordingly.
    You can just keep serial ports open and contiue to communicate over them. But, in my experience with other seialport libraries in Java
    closing the port and re-opening ensures that a device is not kept in the Window's registry unintentionally after a disconnection
    and the serial port enumeration continues to work as expected.
*/
const SerialPort = require('serialport');
const MyDevice = require('./my_device');

function DeviceManager () {

    // helper function that will retrive all of the available serialports on Windows
    // the first two com ports tend to be reserved for the OS hardware.
    this.getPorts = function () { 
        return new Promise((resolve, reject) => {
            let ports = [];
    
            SerialPort.list().then((results) => {
                results.forEach((port) => {
                    //e.g: COM4 on Windows, /dev/tty/look_it_up_yourself on linux
                    let com = port.path;
                    let id = parseInt(com.slice(3));
                    if (id > 2) {
                        ports.push(port.path);
                    }
                });
    
                if (ports.length > 0) {
                    resolve(ports);
                } else {
                    reject (Error("No Serial Ports Found"));
                }
            } , err => {reject (Error("Error:", err))}); 
        });
    };

    //retrieves the Serial Number and OEM info from all of the pods available.
    this.getDeviceInfo = async function(ports) { 
        let pods = [];
        //pings all devices for information simultaneously
        await Promise.all(ports.map(async port => {
            let info = {com:port}
            let pod = new MyDevice(port);
            
            //grabs info from devices
            info['sn'] = await pod.getSn();
            info['dist'] = await pod.getOEM();
            pods.push(info);
            
            pod.port.close();
        }));
            
        return pods;
    }

    //main runner for getting devices. gets device serial numbers and OEM information
    this.getPods = async function () {
        try{
            let ports = await this.getPorts();
            let pods = await this.getPodInfo(ports);
            
            //sort pods to ensure same behavior from promise.all return
            pods.sort(function(a,b){
                let sn1 = a.sn;
                let sn2 = b.sn;
                return (sn1 < sn2) ? -1 : (sn1 > sn2) ? 1 : 0;
            });
            
            return pods;
        } catch (err) {
            return err;
        }
    }

    //checks foe a valid pod and then updates device's OEM
    this.updateDevice = async function(my_device, oem) {
        try{
            let valid_info = true;
            if (valid_info) {
                let device = new MyDevice(my_device.com);
                await device.setOEM(oem);
                my_device.port.close();
            } else {
                throw Error("No valid licenses.");
            }
        } catch (err) {
            throw Error(err);
        }
    }


}


export default DeviceManager;
