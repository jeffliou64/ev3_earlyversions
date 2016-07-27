var SerialPort = require('serialport');
var ev3dev = require('ev3dev-lang');
var motor = new ev3dev.Motor();
var port = new SerialPort('/dev/tty.serialEV3-SerialPort', baudRate = 56700, function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }

});

var DEBUG_NO_EV3 = false;
var theEV3DevicePort = theEV3DevicePort || null;
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

port.on('open', function (error) {
    if (error) {
        console.log('poop');
        return console.log('error: ' + error.message);
    }
    //if (!motor.connected)
    //    console.log("No motor could be found. Are you sure that one is connected?");

    //console.log(' Port: ' + motor.address);
    //console.log(' Driver: ' + motor.driverName);
    //console.log(' Available commands: ' + motor.commands);
    //port.write(new Buffer('0F','00','00','00','80','0','0','148','1','129','100','130','11','2','130','244','1'), function (err) {
    packMessageForSending('80', '00', '00', '94', '01', '81', '64', '82', '0B', '02', '82', 'F4', '01');
    packMessageForSending('80000094018164820B0282F401');
    packMessageForSending('000100811260');
    // packMessageForSending('0F', '00', '00', '00', '80', '0', '0', '148', '1', '129', '100', '130', '11', '2', '130', '244', '1');
    // packMessageForSending('0F000000800014811291001301121302441');
    function packMessageForSending(str) {
        var length = ((str.length / 2) + 2);

        var a = new ArrayBuffer(4);
        var c = new Uint16Array(a);
        var arr = new Uint8Array(a);
        c[1] = counter;
        console.log(c[1]);
        c[0] = length;
        counter++;
        var mess = new Uint8Array((str.length / 2) + 4);

        for (var i = 0; i < 4; i++) {
            mess[i] = arr[i];
        }

        for (var i = 0; i < str.length; i += 2) {
            mess[(i / 2) + 4] = parseInt(str.substr(i, 2), 16);
        }
        console.log(mess);
        return mess;
    }
    
    var happyArray = new Uint8Array([8, 0, 2, 0, 0, 1, 0, 129, 18, 96]);
    port.write(happyArray, function (err) {
        port.drain(function (errr) {
            if (err) {
                return console.log('error: ' + err.message);
            }
            console.log('successful write');
            disconnect();
        })
    })
    
    // var happyArray = new Uint8Array([15, 0, 0, 0, 128, 0, 0, 148, 1, 129, 100, 130, 11, 2, 130, 244, 1]);
    // port.write(happyArray, function (err) {
    //     port.drain(function (errr) {
    //         if (err) {
    //             return console.log('error: ' + err.message);
    //         }
    //         console.log('successful write');
    //         disconnect();
    //     })
    // })
    // port.write(new Buffer('80','00','00','94','01','81','64','82','0B','02','82','F4','01'), function (err) {
    //     port.drain(function (errr) {
    //         if (errr) {
    //             return console.log('error: ' + errr.message);
    //         }
    //         console.log('successful write');
    //         disconnect();
    //     })
    // })
})

disconnect = function () {
    port.close(function (error) {
        if (error) {
            return console.log('error: ' + error.message);
        }
    })
}