var SerialPort = require('serialport');
var q = require('q');


var DEBUG_NO_EV3 = false;
var theEV3Device = theEV3Device || null;
var EV3ScratchAlreadyLoaded = EV3ScratchAlreadyLoaded || false;
var EV3Connected = EV3Connected || false;
var potentialEV3Devices = potentialEV3Devices || [];

var waitingCallbacks = waitingCallbacks || [[], [], [], [], [], [], [], [], []];
var waitingQueries = waitingQueries || [];
var global_sensor_result = global_sensor_result || [0, 0, 0, 0, 0, 0, 0, 0, 0];
var thePendingQuery = thePendingQuery || null;

var connecting = connecting || false;
var notifyConnection = notifyConnection || false;
var potentialDevices = potentialDevices || []; // copy of the list
var warnedAboutBattery = warnedAboutBattery || false;
var deviceTimeout = deviceTimeout || 0;
var counter = counter || 0;
var poller = poller || null;
var pingTimeout = pingTimeout || null;
var connectionTimeout = connectionTimeout || null;

var waitingForPing = waitingForPing || false;
var waitingForInitialConnection = waitingForInitialConnection || false;

var Device = (function () {
    function Device() {
        
    };

    Device.prototype.getStatus = function () {
        if (!EV3Connected) {
            return [disconnected, console.log('disconnected')];
        }
        else {
            return console.log('connected');
        }
    };

    Device.prototype.tryToConnect = function () {
        console.log('tryToConnect()');
        lastCommandWeWereTrying = waitingQueries.pop();
        
        waitingQueries = [];
        thePendingQuery = null;
        
        counter = 0;
        
        var promises = [];
        promises.push(device.getPotentialEV3Devices());
        q.all(promises).then(function () {
            console.log('promises ok');

            potentialEV3Devices.forEach(function (serialport) {
                console.log('attempting to connect with ' + serialport.comName);
                connecting = true;
                var portToConnect = '/dev/tty.' + serialport.comName.substr(8);
                theEV3Device = new SerialPort(portToConnect, baudRate = 56700, function (err) {
                    if (err) {
                        return console.log('Error: ', err.message);
                    }
                    console.log('CONNECTED TO ' + theEV3Device);
                    console.log('CONNECTED TO ' + serialport.comName);
                    EV3Connected = true;
                    connecting = false;
                });


            });
        });
    };

    Device.prototype.getPotentialEV3Devices = function () { //NEEDS PROMISES AND THEN CALLBACK
        return q.Promise(function (resolve, reject, notify) {
            SerialPort.list(function (err, ports) {
                ports.forEach(function (port) {
                    console.log(port.comName);      //defined
                    console.log(typeof port.comName); //string
                    console.log(port.manufacturer); //undefined
                    console.log(port.serialNumber); //undefined
                    console.log(port.pnpId);        //undefined
                    console.log(port.locationId);   //undefined
                    console.log(port.vendorId);     //undefined
                    console.log(port.productId);    //undefined
                    if ((port.comName.indexOf('/dev/cu.serial') === 0 && port.comName.indexOf('-SerialPort') != -1) ||
                        port.comName.indexOf('COM') === 0) {
                        console.log('added ' + port.comName);
                        potentialEV3Devices.push(port);
                    }
                    resolve();
                });
            });
        });
    };
    
    Device.prototype.disconnect = function () {
        port.close(function (error) {
            if (error) {
                return console.log('error: ' + error.message);
            };
        });
    };


    
    return Device;
} ());

var device = new Device();
device.tryToConnect();