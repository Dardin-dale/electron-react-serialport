"use strict";

/*Device API handles all functions that could be passed to a
device via serialport communications 
assume device takes in ASCII encoded buffer streams that are passed through
the serial port object. Proper ASCII commands are dependant on your device
*/
var SerialPort = require('serialport');

var Readline = SerialPort.parsers.Readline;

var MyDevice = function MyDevice(id) {
  //Creates new Serial Port reference
  this.parser = new Readline({
    delimiter: ';',
    encoding: 'ascii'
  }); //initiates port serial object

  this.port = new SerialPort(id, function (err) {
    if (err) throw err;
  }); //sets up pipe for device readline buffer 

  this.port.pipe(this.parser);
  this.com = id; //Turns Device LED On

  this.ledOn = function () {
    //device may expect a carriage return or other delimiter to parse messages
    var command = Buffer.from('CAL,0,1\r\n', 'ascii');
    this.port.write(command, 'ascii', function (err) {
      if (err) throw err;
    });
  }; //Turns LED off


  this.ledOff = function () {
    var command = Buffer.from('CAL,0,0\r\n', 'ascii');
    this.port.write(command, 'ascii', function (err) {
      if (err) throw err;
    });
  }; //Retrieves Pod serial number (index 3 in response)


  this.getSn = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var command = Buffer.from('GET,SER_NUMBER\r\n', 'ascii');
      self.port.write(command, 'ascii', function (err) {
        if (err) reject(err);
        self.port.on('data', function (data) {
          var msg = data.toString('utf8').split(",");
          var sn = msg[3].split(';')[0];
          resolve(sn);
        });
      });
    });
  }; //gets Disti/OEM Key


  this.getOEM = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
      var command = Buffer.from('GET,39\r\n', 'ascii');
      self.port.write(command, 'ascii', function (err) {
        if (err) reject(err);
        self.port.on('data', function (data) {
          var msg = data.toString('utf8').split(",");
          var oem = msg[3].split(';')[0];
          resolve(oem);
        });
      });
    });
  }; //Sets Serial Number for the device


  this.setSn = function (serialnumber) {
    var self = this;
    return new Promise(function (resolve, reject) {
      var command = Buffer.from('SET,SER_NUMBER,' + serialnumber + '\r\n', 'ascii');
      self.port.write(command, 'ascii', function (err) {
        if (err) reject(err);
        self.port.on('data', function (data) {
          var msg = data.toString('utf8').split(",");
          var return_msg = msg[3].split(';')[0];
          resolve(return_msg);
        });
      });
    });
  };
};

module.exports = MyDevice;