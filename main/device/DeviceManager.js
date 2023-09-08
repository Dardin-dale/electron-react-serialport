/* 
    This is the main Device Manager, to keep things consistent device commands should be filtered through here accordingly.
    You can just keep serial ports open and contiue to communicate over them. But, in my experience with other seialport libraries in Java
    closing the port and re-opening better ensures that a device is not kept in the Window's registry unintentionally after a disconnection
    and the serial port enumeration works more reliably; this may depend on your device's driver.
*/
const SerialPort = require( "serialport" );
const Pod = require('./my_device');
const {default: PQueue} = require('p-queue');
//unobtrusive sleep helper function.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
class DeviceManager {

    constructor () {
        //cmdHandler is a Map {id: Pqueue} for managing incoming promises
        //this should prevent cross-talk and race cases.
        this.cmdHandler = {}
        // Map {TrakPod SN: COM} used for pH testing 
        this.trakpods = {}
        //
        this.events = new EventEmitter()
    }
    
    // helper function that will retrive all of the available serialports on Windows
    // the first two com ports tend to be reserved for the OS hardware.
    getPorts = function() {
        return new Promise((resolve, reject) => {
            let ports = [];

            SerialPort.list().then((results) => {
                // console.log("Results: ", results);
                results.forEach((port) => {
                    //e.g: COM4 on Windows, /dev/tty/look_it_up on linux
                    let com = port.path;
                    //Windows specific com parsing
                    //let id = parseInt(com.slice(3));
                    //id > 2 
                    if (port.productId === Pod.PID && port.vendorId === Pod.VID) {
                        ports.push(com);
                        //Adding a promise queue for each device to prevent race cases from the UI
                        if (!this.cmdHandler.hasOwnProperty(com)){
                            this.cmdHandler[com] = new PQueue({concurrency: 1});
                            //This will relay that tasks have been added to the device queue
                            // this.cmdHandler[com].on('add', () => {
                            //     console.log(`Task Added.  Size: ${this.cmdHandler[com].size}  Pending: ${this.cmdHandler[com].pending}`);
                            // });
                        }
                    }
                });

                //fine if there are no ports
                resolve(ports);
                
            }, err => { reject(err); });

        });
    };

    //Retrieves the Serial Number and OEM info from all of the pods available.
    getDeviceInfo = async function (ports) {
        let pods = [];
        let device_map = {}
        let reconnected_pods = [];
        //pings all devices for information simultaneously
        await Promise.allSettled(ports.map(async (port) => {
            await this.cmdHandler[port].add( async () => {
                let info = { com: port };
                try {
                    let pod = new TrakPod(port);
                    let sn = await pod.getSn(false);
                    let offset = await pod.getParam("UCV_INTERCEPT", false);
                    let oem = await pod.getParam("DISTRIBUTOR", false);
                    device_map[sn] = {
                        sn: sn,
                        com: port,
                        offset: offset,
                        oem: oem
                    };
                    // console.log("getting data from port: ", port);
                    //grabs info from devices, don't close port after call so that same connection can be re-used.
                    info['sn'] = sn;
                    info['drift_30_min'] = await pod.getParam("DRIFT_FACT",false);
                    info['drift_1_min'] = await pod.getParam("DRIFT_FACTOR_MIN", false);
                    info['offset'] = offset;
                    info['oem'] = oem;
                    info['fwVersion'] = await pod.getFWVersion(false); // closes port for future use.
                    info['connected'] = true;
                    info['ledOn'] = false;

                    //flash re-connected pod
                    if(this.trakpods.hasOwnProperty(sn)){
                        await pod.close();
                    } else {
                        reconnected_pods.push([pod, sn]);
                    }
                } catch(e) {
                    console.error(e);
                }
                if (info.connected) {
                    pods.push(info);
                }
                //else not properly connected.
            });
        }))
        // .catch(error => { 
        //     throw error
        // });
        this.trakpods = device_map;
        for (var i =0; i < reconnected_pods.length; i++){
            await this._podReconnection(reconnected_pods[i][0], reconnected_pods[i][1]);
        }
        
        return pods;
    };

    //Check pHTest status and flash accordingly
    _podReconnection = async function(trakpod, sn) {
        try{
            //check for active test with TrakPod SN
            let dbTrakPodId = await trakpodController.getTrakPodId(sn);
            let activeTest =  await pHTestController.findActiveBySN(dbTrakPodId);
            // for(var i=0; i < activeTests; i++) {
            //     if(activeTests[i].trakpod.sn === sn){
            //         activeTest = activeTests[i];
            //         break;
            //     }
            // }
            if(activeTest){
                await trakpod.close();
                //handled by pHTestManager
                this.events.emit('check_missed_reads', activeTest);
            } else {
                //flash LED to charge Capacitor
                await trakpod.runRP(); // closes port after use.
            }
        } catch(err){
            //Probably a new pod. no issues.
        }
        
    }

    //main runner for getting devices. gets device serial numbers
    // Runs this in a task scheduler and pass to Redux
    getDevices = async function () {
        try {
            // console.log("getting devices.");
            let pods = [];
            let ports = await this.getPorts();
            //Clean up device manager CQueues
            for (const port in this.cmdHandler) {
                if (!ports.includes(port)) {
                    delete this.cmdHandler[port];
                }
            }

            if (ports) {
                //testing ports with data retrieval ensures the device is connected
                pods = await this.getDeviceInfo(ports);
            }
            
            // console.log("Pods: ", pods);
            //sort pods to ensure same behavior from promise.all return
            pods.sort(function (a, b) {
                let sn1 = a.sn;
                let sn2 = b.sn;
                return (sn1 < sn2) ? -1 : (sn1 > sn2) ? 1 : 0;
            });
            return pods;
        }
        catch (err) {
            console.log("Error: ", err);
            return err;
        }
    };

    // /**
    //  * Toggles LED on or off
    //  * @param {TrakPodJSON} trakpod - trakpod json information
    //  */
    // this.ledToggle = async function (trakpod) {
    //     try {
    //         let device = new TrakPod(trakpod.com);
    //         if (my_device.ledOn) {
    //            await this.cmdHandler[trakpod.com].add(device.ledOff());
    //         }
    //         else {
    //            await this.cmdHandler[trakpod.com].add(device.ledOn());
    //         }
    //     }
    //     catch (err) {
    //         return Error(err);
    //     }
    // };

    /** 
     * Tells device to collect RP data from the TrakPod
     * Blanks added by default
     * @param {TrakPodJSON} trakpod - trakpod json information
     */
    readRP = async function(trakpod) {
        return await this.cmdHandler[trakpod.com].add(async () => {
            let device = new TrakPod(trakpod.com);
            let data = await device.runRP();
            return data[0];
        }).catch(err =>{
            return Error(err)
        });
    }

    /**
     * Runs pHtest with pre-formatted string
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} phString - full pH test string with comma separated parameter values.
     */
    readpH = async function(trakpod, phString) {
        return await this.cmdHandler[trakpod.com].add(async () => {
            let device = new TrakPod(trakpod.com);
            let data = await device.runpH(phString);
            return data[0];
        }).catch(err =>{
            return Error(err)
        });
    }

    /**
     * Runs Firmware QC Test/re-alignment.
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} qcString - full QC string with comma separated parameter values.
     */
    reAlignQC = async function(trakpod, qcString) {
        try{
            // console.log("TrakPod: ", trakpod);
            // console.log("String: ", qcString);
            let qcCommand = qcString.split('-').join(',').slice(0, -1);
            return await this.cmdHandler[trakpod.com].add(async () => {
                let device = new TrakPod(trakpod.com);
                let data = await device.runQC(qcCommand);
                // console.log("Data: ", data);
                return data;
            }).catch(err =>{
                return Error(err)
            });
        } catch (err) {
            return Error(err);
        }
    }

    /**
     * Retrieves specified parameter for TrakPod
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} param 
     */
    getParam = async function(trakpod, param) {
        return await this.cmdHandler[trakpod.com].add(async () => {
            let device = new TrakPod(trakpod.com);
            let data = await device.getParam(param);
            return data;
        }).catch(err =>{
            return Error(err)
        });
    }

    getParams = async function(trakpod, params) {
        try{
            return await this.cmdHandler[trakpod.com].add(async () => {
                let device = new TrakPod(trakpod.com);
                device.port.setMaxListeners(15);//add limits for port listeners to prevent warnings. listeners >= params.length
                let result = [];
                for(var i = 0; i < params.length-1; i++){
                    let data = await device.getParam(params[i], false);
                    result.push(data);
                }
                let data = await device.getParam(params[params.length-1]); // close port
                result.push(data);
                return result;
            }).catch(err => {
                return Error(err);
            });
        } catch (err) {
            return Error(err);
        }
    }
        

    /**
     * This will set and save a single TrakPod parameter. 
     * NOTE: THIS WILL NOT SAVE PARAM PERMANENTLY
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} param 
     * @param {string} value 
     */
    setParam = async function(trakpod, param, value) {
        return await this.cmdHandler[trakpod.com].add(async () => {
            let device = new TrakPod(trakpod.com);
            let data = await device.setParam(param, value);
            return data;
        }).catch(err =>{
            return Error(err)
        });
    }

    /**
     * This will save all current changes to the TrakPod parameters
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} param 
     * @param {string} value 
     */
    saveParams = async function(trakpod) {
        return await this.cmdHandler[trakpod.com].add(async () => {
            let device = new TrakPod(trakpod.com);
            let data = await device.saveParams(trakpod);
            return data;
        }).catch(err =>{
            return Error(err)
        });
    }


    /**
     * This will set and save a single TrakPod parameter.
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {string} param 
     * @param {string} value 
     */
    updateParam = async function(trakpod, param, value) {
        try {
            let data = await this.setParam(trakpod, param, value, false);
            data = await this.saveParams(trakpod);
            return data;
        } catch (err) {
            return Error(err);
        }
    }

    
    /**
     * Updates multiple parameters for a TrakPod and saves them. The device must 
     * remain connected to save all of the parameters correctly.
     * @param {TrakPodJSON} trakpod - trakpod json information
     * @param {Map} param_map - key value pairs of parameters and updated values
     */
    updateParams = async function(trakpod, param_map) {
        try {
            let data;
            for (const param in param_map){
                data = await this.setParam(trakpod, param, param_map[param]);
            }
            data = await this.saveParams(trakpod);
            return data;
        } catch (err) {
            return Error(err);
        }
    }

    /* /** */
    /*  * Initaite process for updating TrakPod Firmware from local file */
    /*  * @param {TrakPodJSON} trakpod  */
    /*  */ */
    /* updateLocalFirmware = async function(trakpod, win) { */
    /*     return await this.cmdHandler[trakpod.com].add(async()=> { */
    /*         let device = new TrakPod(trakpod.com); */
    /*         let res; */
    /*         console.log("Attempting DFU Mode..") */
    /*         let podreturn = await device.enterDFUMode(); */
    /*         console.log("pod in dfu mode", podreturn.toString().trim()); */
    /*         await sleep(1000); //wait for OS to refresh devices. */
    /*         res = firmwareHelper.updateFromLocal(win); */
    /*         return res; */
    /*     }).catch(err =>{ */
    /*         return Error(err) */
    /*     }); */
    /* } */
    /**/
    /* /** */
    /*  * Initaite process for updating TrakPod Firmware fom Web Host */
    /*  * @param {TrakPodJSON} trakpod  */
    /*  */ */
    /*  updateWebFirmware = async function(trakpod) { */
    /*     return await this.cmdHandler[trakpod.com].add(async()=> { */
    /*         let device = new TrakPod(trakpod.com); */
    /*         await device.enterDFUMode(); */
    /*         //TODO: FirmwareHelper.updateFromWeb(); */
    /*     }).catch(err =>{ */
    /*         return Error(err) */
    /*     }); */
    /* } */
}

/**
 * Private constructor to convert the Device manager into a singleton instance
 */
 class Singleton {
    constructor() {
        throw new Error('Use DeviceManager.getInstance()');
    }
    
    static getInstance() {
        if (!Singleton.instance) {
            Singleton.instance = new DeviceManager();
        }
        return Singleton.instance;
    }
}

module.exports = Singleton;
