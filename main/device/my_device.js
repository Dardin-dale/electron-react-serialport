/*Device API handles all functions that could be passed to a
device via serialport communications 
assume device takes in ASCII encoded buffer streams that are passed through
the serial port object. Proper ASCII commands are dependant on your device
*/

const SerialPort = require( "serialport" );
const Readline = SerialPort.parsers.Readline;


//Simple call just gets basic call response from device
//only verifies that device Acknowledges receipt
simple_call = function (self, resolve, reject, command) {
    self.port.write(command, 'ascii', function(err) {
        if (err) reject(err);
        self.port.on('data', (data) => {
            let msg = data.toString('utf8').split(";");
            let info = msg[0].split(",");
            if(!(info[0] === "!ACK")){
                reject("Command: " + command + "not properly acknowledged.")
            }
            resolve(data)
        });
    });
};

/*
Data Call, data needs to be retrieved from non_volatile memory on the device.
This data is returned within the Acknowlegement from the device.
Some of the parsing will depend on your device.
*/
data_call = function(self, resolve, reject, command) {
    self.port.write(command, 'ascii', function(err) {
        if (err) reject(err);
        self.port.on('data', (data) => {
            let msg = data.toString('utf8').split(";");
            let checksum = msg[1];
            let info = msg[0].split(",");
            //Validate that the command was properly acknowledged
            if(!(info[0] === "!ACK")){
                reject("Command: " + command + "not properly acknowledged.")
            }
            //Validate that all information was correct in the message
            if (!validate_checksum(msg, checksum)) {
                reject("Invalid Checksum");
            }
            resolve(info[3]);
        });
    });
}

/*
Long call, waits for an expected response signature,
expected should be the first enum in the returned data
device gives acknowlegement, calculates/collects info, 
then sends second response with the data collected from
the device.
*/
long_call = function (self, resolve, reject, command, expected) {
    let collected_data = [];
    self.port.write(command, 'ascii', function(err) {
        if (err) throw err;
        self.port.on('data', (data) => {
            let msg = data.toString('utf8').split(";");
            let checksum = msg[1];
            let info = msg[0].split(",");
            if (!validate_checksum(msg[0], checksum)) {
                reject("Invalid Checksum");
            }
            if (info[0] === "!ACK") {
                console.log("Command acknowledged");
            } else if (info[0]==="!NACK") {
                console.log("Invalid Command!");
                //TODO: maybe resolve instead?
                reject("Invalid Command");
            } else if (info[0] === expected){
                collected_data.push(msg[0]);
            }
            if (msg[0] === self.idle){
                resolve(collected_data);
            }
            // TODO: add some resolve logic for various data call back
        });
    });
}


// Dummy CRC checksum validation, will depend on your device's command process
// This also ensures that all the data is recieved correctly
validate_checksum = function(msg, checksum) {
    return checksum;
}


//This is the SerialPort device Class with Relevent information
//I've decided to keep the Promise within this class for consistency.
var MyDevice = function (id) {
    //Creates new Serial Port reference
    this.parser = new Readline({delimiter: '\n', encoding: 'ascii'});

    //initiates port serial object
    this.port = new SerialPort(id, function (err) {
            if (err) throw err;
        });

    //sets up pipe for device readline buffer 
    this.port.pipe(this.parser);

    this.com = id;

    //This is the response when the device is Idle after a long command
    this.idle = '!STATUS,IDLE'

    //Turns Device LED On
    this.ledOn = function() {
        let self = this;
        let command = Buffer.from('CAL,0,1\r\n', 'ascii');
        return new Promise(function(resolve, reject) {
            simple_call(self, resolve, reject, command);
        });
    };

    //Turns LED off
    this.ledOff = function() {
        let self = this;
        let command = Buffer.from('CAL,0,0\r\n', 'ascii');
        return new Promise(function(resolve, reject) {
            simple_call(self, resolve, reject, command);
        });
    };

    //Retrieves Pod serial number (index 3 in response)
    this.getSn = function() {
        let self = this;
        let command = Buffer.from('GET,SER_NUMBER\r\n', 'ascii');
        //return data_call2(self, command);
        return new Promise(function(resolve, reject) {
            data_call(self, resolve, reject, command);
        });
    };

    //gets Disti/OEM Key
    this.getOEM = function() {
        let self = this;
        let command = Buffer.from('GET,39\r\n', 'ascii');
        return new Promise(function(resolve, reject) {
            data_call(self, resolve, reject, command);
        });
    };

    //Sets Serial Number for the device
    this.setSn = function(serialnumber) {
        let self = this;
        let command = Buffer.from('SET,SER_NUMBER,' + serialnumber + '\r\n', 'ascii');
        return new Promise(function(resolve, reject) {
            data_call(self, resolve, reject, command);
        });
    };
    
    //Have the Device collect some data
    this.collectData = function() {
        let self = this;
        let command = Buffer.from('RUN_RP,0\r\n');
        let expected = "!RP"
        return new Promise(function(resolve,reject){
            long_call(self, resolve, reject, command, expected);
        })
    }

    this.collectSpecial = function() {
        let self = this;
        let command = Buffer.from('RUN_QC,Z069,0967,1330,4\r\n');
        let expected = '!QC'
        return new Promise(function(resolve, reject) {
            long_call(self, resolve, reject, command, expected)
        })
    }

}


module.exports = MyDevice;