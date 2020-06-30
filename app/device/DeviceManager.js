"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* 
    This is the main Device Manager, to keep things consistent device commands should be filtered through here accordingly.
    You can just keep serial ports open and contiue to communicate over them. But, in my experience with other seialport libraries in Java
    closing the port and re-opening ensures that a device is not kept in the Window's registry unintentionally after a disconnection
    and the serial port enumeration continues to work as expected.
*/
var SerialPort = require('serialport');

var MyDevice = require('./my_device');

function DeviceManager() {
  // helper function that will retrive all of the available serialports on Windows
  // the first two com ports tend to be reserved for the OS hardware.
  this.getPorts = function () {
    return new Promise(function (resolve, reject) {
      var ports = [];
      SerialPort.list().then(function (results) {
        results.forEach(function (port) {
          //e.g: COM4 on Windows, /dev/tty/look_it_up_yourself on linux
          var com = port.path;
          var id = parseInt(com.slice(3));

          if (id > 2) {
            ports.push(port.path);
          }
        });

        if (ports.length > 0) {
          resolve(ports);
        } else {
          reject(Error("No Serial Ports Found"));
        }
      }, function (err) {
        reject(Error("Error:", err));
      });
    });
  }; //retrieves the Serial Number and OEM info from all of the pods available.


  this.getDeviceInfo =
  /*#__PURE__*/
  function () {
    var _ref = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee2(ports) {
      var pods;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              pods = []; //pings all devices for information simultaneously

              _context2.next = 3;
              return Promise.all(ports.map(
              /*#__PURE__*/
              function () {
                var _ref2 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(port) {
                  var info, pod;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          info = {
                            com: port
                          };
                          pod = new MyDevice(port); //grabs info from devices

                          _context.next = 4;
                          return pod.getSn();

                        case 4:
                          info['sn'] = _context.sent;
                          _context.next = 7;
                          return pod.getOEM();

                        case 7:
                          info['dist'] = _context.sent;
                          pods.push(info);
                          pod.port.close();

                        case 10:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x2) {
                  return _ref2.apply(this, arguments);
                };
              }()));

            case 3:
              return _context2.abrupt("return", pods);

            case 4:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }(); //main runner for getting devices. gets device serial numbers and OEM information


  this.getdevices =
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3() {
    var ports, pods;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return this.getPorts();

          case 3:
            ports = _context3.sent;
            _context3.next = 6;
            return this.getPodInfo(ports);

          case 6:
            pods = _context3.sent;
            //sort pods to ensure same behavior from promise.all return
            pods.sort(function (a, b) {
              var sn1 = a.sn;
              var sn2 = b.sn;
              return sn1 < sn2 ? -1 : sn1 > sn2 ? 1 : 0;
            });
            return _context3.abrupt("return", pods);

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3["catch"](0);
            return _context3.abrupt("return", _context3.t0);

          case 14:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[0, 11]]);
  })); //checks foe a valid pod and then updates device's OEM

  this.updateDevice =
  /*#__PURE__*/
  function () {
    var _ref4 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee4(my_device, oem) {
      var valid_info, device;
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              valid_info = true;

              if (!valid_info) {
                _context4.next = 9;
                break;
              }

              device = new MyDevice(my_device.com);
              _context4.next = 6;
              return device.setOEM(oem);

            case 6:
              my_device.port.close();
              _context4.next = 10;
              break;

            case 9:
              throw Error("No valid licenses.");

            case 10:
              _context4.next = 15;
              break;

            case 12:
              _context4.prev = 12;
              _context4.t0 = _context4["catch"](0);
              throw Error(_context4.t0);

            case 15:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, null, [[0, 12]]);
    }));

    return function (_x3, _x4) {
      return _ref4.apply(this, arguments);
    };
  }();

  this.ledOn =
  /*#__PURE__*/
  function () {
    var _ref5 = _asyncToGenerator(
    /*#__PURE__*/
    regeneratorRuntime.mark(function _callee5(my_device) {
      var device;
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              device = new MyDevice(my_device.com);
              device.ledOn();
              my_device.port.close();
              _context5.next = 9;
              break;

            case 6:
              _context5.prev = 6;
              _context5.t0 = _context5["catch"](0);
              throw Error(_context5.t0);

            case 9:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, null, [[0, 6]]);
    }));

    return function (_x5) {
      return _ref5.apply(this, arguments);
    };
  }();
}

var _default = DeviceManager;
exports["default"] = _default;