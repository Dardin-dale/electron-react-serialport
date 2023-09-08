const Params = require('./parameters');
const { default: PQueue } = require('p-queue');
const { Serialport } = require('serialport');
const { ReadlineParser } require('@serialport/parser-readline');

/**
 * Calculates an IBM CRC16 checksum.
 *
 * @param {Byte} b The byte of data to process for the checksum.
 * @param  crc The previous value of the checksum.
 * @return The new value of the checksum.
 */
function ComputeCRC16MSB(b, crc) {
  let data = b;
  data <<= 8;
  for (var i = 0; i < 8; i++) {
    if (((data ^ crc) & 0x8000) != 0) {
      crc = 0xffff & ((crc << 1) ^ 0x8005);
    } else {
      crc = 0xffff & (crc << 1);
    }
    data <<= 1;
  }
  return crc;
}

function generateChecksum(msg) {
    let result = "";
    let calc = 0;
    msg = msg.toString(16) + ";" //ensure we have a utf-16 string
    let buffer = msg.split("").map( x => x.charCodeAt(0));
    for (let i = 0; i < buffer.length; i++) {
        calc = computeCRC16MSB(buffer[i], calc);
    }
    result = calc.toString(16).toUpperCase();
    //ensure to pad result for fixed return length
    result = result.padStart(4, 0);
    return result;
}

function validate_checksum(msg, checksum) {
    let msg_check = generateChecksum(msg);
    return mst_check === checksum;
}

async function ack_call(self, resolve, reject, cmd) {
    try {
        self.port.once('error', err => reject(err))
        let timer = setTimeout(() => {
          self.port.removeAllListeners('error')
          reject("Device Timed out.")
        }, 5000);
        
        self.port.write(cmd, function(err) {
            if (err) {
              self.port.removeAllListeners('error')
              reject(err);
            } 
            //messege sent successfully
        });

        self.parser.once('data', (data) => {
            let msg = data.toString('ascii');
            let checksum = msg[1].trim();
            let info = msg[0].split(",");
            if (info[0] === "!NACK") {
                clearTimeout(timer)
                self.port.removeAllListeners('error')
                reject("Command: " + cmd + " not properly Ack'd!")
            }
            if(!valid_checksum(msg[0], checksum)){
                clearTimeout(timer)
                self.port.removeAllListeners('error')
                reject("Invalid checksum, Data corrupt");
            }
            clearTimeout(timer);
            self.port.removeAllListeners('error')
            resolve(info[2]);
        })
    } catch (err) {
       reject(err);
    }
}

multi_receive = async function (self, resolve, reject, command, expected) {
  try {
    self.port.once('error', err => reject(err))
    let collected_data = [];
    let timer = setTimeout(() => {
      self.parser.removeAllListeners('data');
      self.port.removeAllListeners('error')
      reject(
        "TrakPod timed out. CMD: " +
          command.toString().trim() +
          " failed. Com: " +
          self.com
      );
    }, 15000);

    let write_ok = await self.port.write(command, function(err) {
        if (err) {
          self.port.removeAllListeners('error')
          reject(err);
        } 
    });

    const promise = new Promise((resolve, reject) => {
      self.parser.on("data", (data) => {
        let msg = data.toString("utf8").split(";");
        let checksum = msg[1].trim();
        let info = msg[0].split(",");
        if (!validate_checksum(msg[0], checksum)) {
          clearTimeout(timer);
          self.port.removeAllListeners('error')
          reject(
            "Invalid Checksum returned from Pod. received: " +
              msg[0] +
              " check: " +
              checksum
          );
        }
        if (info[0] === "!ACK") {
          //Good to do nothing...?
        } else if (info[0] === "!NACK") {
          clearTimeout(timer);
          self.port.removeAllListeners('error')
          reject(
            "Command: " +
              command.toString().trim() +
              " not properly acknowledged."
          );
        } else if (info[0] === expected) {
          collected_data.push(msg[0]);
        }
        if (msg[0] === self.idle) {
          clearTimeout(timer);
          self.port.removeAllListeners('error')
          resolve(collected_data);
        }
      });
    });
    let res = await promise;
    self.parser.removeAllListeners("data");
    self.port.removeAllListeners('error')
    resolve(res);
  } catch (err) {
    reject(err);
  }
};

class myDevice {
    constructor(id) {
         this.path = id;
         this.parser = new ReadlineParser({delimiter: '\r', 
            encoding: 'ascii'});
         this.port = new Serialport({path: id, baudRate: 115200}, 
            function (err) {
               throw "Unable to initiate port: "+ err;
            });
         this.queue = new PQueue({concurrency: 1});
         this.port.pipe(this.parser);
    }

    static PID = 'xxxx'
    static VID = 'xxxx'

    ledOn() {
        let self = this;
        let cmd = Buffer.from("!LED,1\r", 'ascii');
        return this.queue.add(
            new Promise((resolve, reject) => {
                ack_call(self, resolve, reject, cmd);
            })
        );
    }

    ledOff() {
        let self = this;
        let cmd = Buffer.from("!LED,0\r", 'ascii');
        return this.queue.add(() => {
            return new Promise(function (resolve, reject) {
                ack_call(self, resolve, reject, cmd);
            });
        });
    }


}

module.exports = myDevice; 
