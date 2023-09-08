const device_routes = require('./device');
const app_routes = require('./app');


const routes = function () {
    app_routes();
    device_routes();
}

module.exports = routes;
