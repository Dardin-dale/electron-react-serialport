/*
Command Queue handles ensures that commands to the serial devices
are handled in order. Prevents race cases and errors in communication over Serial.
*/

module.exports = class CQueue {
    constructor() {
      this.queue = [];
      this.workingOnPromise = false;
    }
    
  
  add(promise) {
    console.log("adding to queue")
    return new Promise((resolve, reject) => {
        this.queue.push({
            promise,
            resolve,
            reject,
        });
        this.dequeue();
    });
  }
  
  static dequeue = function() {
    console.log("dequeing")
      if (this.workingOnPromise) {
        return false;
      }
      const item = this.queue.shift();
      if (!item) {
        return false;
      }
      try {
        this.workingOnPromise = true;
        item.promise()
          .then((value) => {
            this.workingOnPromise = false;
            item.resolve(value);
            this.dequeue();
          })
          .catch(err => {
            this.workingOnPromise = false;
            item.reject(err);
            this.dequeue();
          })
      } catch (err) {
        this.workingOnPromise = false;
        item.reject(err);
        this.dequeue();
      }
      return true;
    }
  }