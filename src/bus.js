const { EventEmitter } = require('events');

class Bus extends EventEmitter {}
const bus = new Bus();
bus.setMaxListeners(50);

module.exports = bus;
