/*Device API handles all functions that could be passed to a
device via serialport communications 
assume device takes in ASCII encoded buffer streams that are passed through
the serial port object. Proper ASCII commands are dependant on your device
*/

const SerialPort = require( "serialport" );
const Readline = SerialPort.parsers.Readline;


//Simple call just gets basic call response from device
//only verifies that device Acknowledges receipt
simple_call = function (self, command) {
    return new Promise(function(resolve, reject) {
        self.port.write(command, 'ascii', function(err) {
            if (err) throw err;
            self.port.on('data', (data) => {
                resolve(data)
            });
        });
    });
};

/*
Long call, waits for an expected response signature,
expected should be the first enum in the returned data
device gives acknowlegement, calculates/collects info, 
then sends second response with data 
*/
long_call = function (self, command, expected) {
    return new Promise(function(resolve, reject) {
        self.port.write(command, 'ascii', function(err) {
            if (err) throw err;
            self.port.on('data', (data) => {
                let msg = data.toString('utf8').split(";");
                let checksum = msg[1];
                let info = msg[0];
                if (!validate_checksum(checksum)) {
                    reject("Invalid Checksum");
                }
                
                
            });
        });
    });
}

// Dummy checksum validation, will depend on your device's internal process 
validate_checksum = function(checksum) {
    return checksum;
}


//This is the SerialPort device Class with Relevent information
//Add all of the 
var MyDevice = function (id) {
    //Creates new Serial Port reference
    this.parser = new Readline({delimiter: ';', encoding: 'ascii'});

    //initiates port serial object
    this.port = new SerialPort(id, function (err) {
            if (err) throw err;
        });

    //sets up pipe for device readline buffer 
    this.port.pipe(this.parser);

    this.com = id;

    //Turns Device LED On
    this.ledOn = function() {
        let self = this;
        let command = Buffer.from('CAL,0,1\r\n', 'ascii');
        return simple_call(self, command);
    };

    //Turns LED off
    this.ledOff = function() {
        let self = this;
        let command = Buffer.from('CAL,0,0\r\n', 'ascii');
        return simple_call(self, command);
    };

    //Retrieves Pod serial number (index 3 in response)
    this.getSn = function() {
        let self = this;
        return new Promise(function(resolve, reject) {
            let command = Buffer.from('GET,SER_NUMBER\r\n', 'ascii');
            self.port.write(command, 'ascii', function(err) {
                if (err) reject(err);
                self.port.on('data', (data) => {
                    let msg = data.toString('utf8').split(",");
                    let sn = msg[3].split(';')[0];
                    resolve(sn);
                });
            });
        }); 
    };

    //gets Disti/OEM Key
    this.getOEM = function() {
        let self = this;
        return new Promise(function(resolve, reject) {
            let command = Buffer.from('GET,39\r\n', 'ascii');
            self.port.write(command, 'ascii', function(err) {
                if (err) reject(err);
                self.port.on('data', (data) => {
                    let msg = data.toString('utf8').split(",");
                    let oem = msg[3].split(';')[0];
                    resolve(oem);
                });
            });
        });
    };

    //Sets Serial Number for the device
    this.setSn = function(serialnumber) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let command = Buffer.from('SET,SER_NUMBER,' + serialnumber + '\r\n', 'ascii');
            self.port.write(command, 'ascii', function(err) {
                if (err) reject(err);
                self.port.on('data', (data) => {
                    let msg = data.toString('utf8').split(",");
                    let return_msg = msg[3].split(';')[0];
                    resolve(return_msg);
                });
            });
        });
    };    

}


module.exports = MyDevice;