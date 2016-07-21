var SerialPort = require('serialport');
var q = require('q');
//var window = require('window');

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

var Device = (function () {
    function Device() {
        this.DEBUG_NO_EV3 = false;
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
                theEV3DevicePort = new SerialPort(portToConnect, baudRate = 56700, function (err) {
                    if (err) {
                        return console.log('Error: ', err.message);
                    }
                    console.log('CONNECTED TO ' + theEV3DevicePort);
                    console.log('CONNECTED TO ' + serialport.comName);
                    EV3Connected = true;
                    connecting = false;
                    testTheConnection(startupBatteryCheckCallback);
                });
                
                if (!connecting && !EV3Connected) {
                    device.disconnect();
                }
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
    
    function startupBatteryCheckCallback(result) {
        console.log('got battery level at connect: ' + result);
        waitingForInitialConnection = false;
        EV3Connected = true;
        connecting = false;
        
        if (result < 11 && !warnedAboutBattery) {
            alert('Your Battery is getting low. ');
            warnedAboutBattery = true;
        }
        
        if (lastCommandWeWereTrying) {
            waitingQueries.push(lastCommandWeWereTrying);
            executeQueryQueue();
        }
    }
    
    function testTheConnection(theCallback) {
        readBatteryLevel(theCallback);
    }
    
    Device.prototype.disconnect = function () {
        port.close(function (error) {
            if (error) {
                return console.log('error: ' + error.message);
            };
        });
    };

    var DIRECT_COMMAND_PREFIX = "800000";
    var DIRECT_COMMAND_REPLY_PREFIX = "000100";
    var DIRECT_COMMAND_REPLY_SENSOR_PREFIX = "000400";
    var DIRECT_COMMAND_REPLY_MOTOR_PREFIX = "000500";
    // direct command opcode/prefixes
    var SET_MOTOR_SPEED = "A400";
    var SET_MOTOR_STOP = "A300";
    var SET_MOTOR_START = "A600";
    var SET_MOTOR_STEP_SPEED = "AC00";
    var NOOP = "0201";
    var PLAYTONE = "9401";
    var INPUT_DEVICE_READY_SI = "991D";
    var READ_SENSOR = "9A00";
    var UIREAD = "81"; // opUI_READ
    var UIREAD_BATTERY = "12"; // GET_LBATT

    var mode0 = "00";
    var TOUCH_SENSOR = "10";
    var COLOR_SENSOR = "1D";
    var ULTRASONIC_SENSOR = "1E";
    var ULTRSONIC_CM = "00";
    var ULTRSONIC_INCH = "01";
    var ULTRSONIC_LISTEN = "02";
    var ULTRSONIC_SI_CM = "03";
    var ULTRSONIC_SI_INCH = "04";
    var ULTRSONIC_DC_CM = "05";
    var ULTRSONIC_DC_INCH = "06";

    var GYRO_SENSOR = "20";
    var GYRO_ANGLE = "00";
    var GYRO_RATE = "01";
    var GYRO_FAST = "02";
    var GYRO_RATE_AND_ANGLE = "03";
    var GYRO_CALIBRATION = "04";
    var IR_SENSOR = "21";
    var IR_PROX = "00";
    var IR_SEEKER = "01";
    var IR_REMOTE = "02"
    var IR_REMOTE_ADVANCE = "03";
    var IR_CALIBRATION = "05";
    var REFLECTED_INTENSITY = "00";
    var AMBIENT_INTENSITY = "01";
    var COLOR_VALUE = "02";
    var COLOR_RAW_RGB = "04";
    var READ_FROM_MOTOR = "FOOBAR";

    var DRIVE_QUERY = "DRIVE_QUERY";
    var DRIVE_QUERY_DURATION = "DRIVE_QUERY_DURATION";
    var TONE_QUERY = "TONE_QUERY";

    function createMessage(str) {
        return str;
    }
    
    function packMessageForSending(str) {
        var length = ((str.length / 2) + 2);
        
        var a = new ArrayBuffer(4);
        var c = new Uint16Array(a);
        var arr = new Uint8Array(a);
        
        c[1] = counter;
        c[0] = length;
        counter++;
        var packedCommand = new Uint8Array((str.length / 2) + 4);
        for (var i = 0; i < 4; i++) {
            packedCommand[i] = arr[i];
        }
        
        for (var i = 0; i < str.length; i += 2){
            packedCommand[(i / 2) + 4] = parseInt(str.substr(i, 2), 16);
        }
        
        return packedCommand;
    }

    function createHexString(arr) {
        var result = "";
        for (i in arr) {
            var str = arr[i].toString(16);
            str = str.toUpperCase();
            str = str.length == 0 ? "00" :
                str.length == 1 ? "0" + str :
                    str.length == 2 ? str :
                        str.substring(str.length - 2, str.length);
            result += str;
        }
        return result;
    }    
    
    function sendCommand(commandArray) {
        if ((EV3Connected || connecting) && theEV3DevicePort) {
            console.log("sending: " + createHexString(commandArray));

            theEV3DevicePort.write(commandArray.buffer, function (error) {
                if (error) {
                    console.log('error: ' + error);
                }
                
            });
        }
        else {
            console_log("sendCommand called when not connected");
        }
    }

    function executeQueryQueueAgain() {
        setTimeout(function () {
            executeQueryQueue();
        } , 1);
    }    

    function executeQueryQueue() {
        if (waitingQueries.length == 0) {
            return;
        }

        if (!EV3Connected && !connecting) {
            console.log('executeQueryQueue() called with no connection');
            if (theEV3DevicePort && !connecting) {
                tryToConnect();
            }
            // else if (!connecting) {
            //     tryAllDevices();
            // }
            return;
        }
        
        var query_info = waitingQueries[0]; //peek at first in line
        var thisCommand = null;
        
        if (query_info.length == 5) { //query with a response
            var port = query_info[0];
            var type = query_info[1];
            var mode = query_info[2];
            var callback = query_info[3];
            var theCommand = query_info[4];

            if (thePendingQuery) {
                //we are waiting for a result
                if (thePendingQuery[0] == port) {
                    // special case: we are actually already in the process of querying this same sensor (should we also compare the type and mode, or maybe just match the command string?)
                    // so we don't want to bother calling it again
                    waitingQueries.shift();
                    if (callback) {
                        waitingCallbacks[port].push(callback);
                    }
                    return;
                }
                //do nothing. we'll try again after the query finishes
                return;
            }
            waitingQueries.shift(); //remove it from the queue
            thePendingQuery = query_info;
            console.log('we made it this far');
            //actually go ahead and make the query
            var packedCommand = packMessageForSending(theCommand);
            sendCommand(packedCommand);
        }
        else if (query_info.length == 4) // a query with no response
        {
            if (thePendingQuery)    // bail if we're waiting for a response
                return;

            var type = query_info[0];
            var duration = query_info[1];
            var callback = query_info[2];
            var theCommand = query_info[3];

            if (type == DRIVE_QUERY || type == DRIVE_QUERY_DURATION) {
                clearDriveTimer();
                if (type == DRIVE_QUERY_DURATION) {
                    driveCallback = callback;   // save this callback in case timer is cancelled we can call it directly
                    driveTimer = window.setTimeout(function () {
                        if (duration > 0) // allow zero duration to run motors asynchronously
                        {
                            motorsStop('coast'); // xxx
                        }
                        if (callback)
                            callback();
                    }, duration * 1000);
                }
            }
            else if (type == TONE_QUERY) {
                window.setTimeout(function () {
                    if (callback)
                        callback();
                }, duration); // duration already in ms
            }
            waitingQueries.shift(); // remove it from the queue

            // actually go ahead and make the query
            var packedCommand = packMessageForSending(theCommand);
            sendCommand(packedCommand);

            executeQueryQueueAgain();   // maybe do the next one
        }
    }

    function addToQueryQueue(query_info) {
        for (var i = 0; i < waitingQueries.length; i++) {
            var next_query = waitingQueries[i];
            if (next_query.length == 5) { //query with response
                var port = next_query[0];
                var type = next_query[1];
                var mode = next_query[2];
                var callback = next_query[3];
                var command = next_query[4];
                var this_port = query_info[0];
                
                if (port == this_port) {
                    var this_callback = query_info[3];
                    if (this_callback) {
                        waitingCallbacks[this_port].push(this_callback);
                    }
                    console.log("coalescing query because there's already one in queue");
                    return;
                }
            }
        }
        waitingQueries.push(query_info);
        executeQueryQueue();
    }


    function readBatteryLevel(callback) {
        console.log('going to read battery level');
        var portInt = 8; //bogus port number
        UIRead(portInt, UIREAD_BATTERY, callback);
    }

    function readFromSensor() {

    }

    function readFromSensor2() {

    }

    function readFromAMotor() {

    }

    function UIRead(port, subtype, callback) {
        var theCommand = createMessage(DIRECT_COMMAND_REPLY_PREFIX +
            UIREAD + subtype +
            "60");
        
        addToQueryQueue([port, UIREAD, subtype, callback, theCommand]);
    }





    // var descriptor = {
    //     blocks: [
    //         ['w', 'drive %m.dualMotors %m.turnStyle %n seconds', 'steeringControl', 'B+C', 'forward', 3],
    //         [' ', 'start motor %m.whichMotorPort speed %n', 'startMotors', 'B+C', 100],
    //         [' ', 'rotate motor %m.whichMotorPort speed %n by %n degrees then %m.breakCoast', 'motorDegrees', 'A', 100, 360, 'break'],
    //         [' ', 'stop all motors %m.breakCoast', 'allMotorsOff', 'break'],
    //         ['h', 'when button pressed on port %m.whichInputPort', 'whenButtonPressed', '1'],
    //         ['h', 'when IR remote %m.buttons pressed port %m.whichInputPort', 'whenRemoteButtonPressed', 'Top Left', '1'],
    //         ['R', 'button pressed %m.whichInputPort', 'readTouchSensorPort', '1'],
    //         ['w', 'play note %m.note duration %n ms', 'playTone', 'C5', 500],
    //         ['w', 'play frequency %n duration %n ms', 'playFreq', '262', 500],
    //         ['R', 'light sensor %m.whichInputPort %m.lightSensorMode', 'readColorSensorPort', '1', 'color'],
    //         //    ['w', 'wait until light sensor %m.whichInputPort detects black line',   'waitUntilDarkLinePort',   '1'],
    //         ['R', 'measure distance %m.whichInputPort', 'readDistanceSensorPort', '1'],
    //         ['R', 'remote button %m.whichInputPort', 'readRemoteButtonPort', '1'],
    //         // ['R', 'gyro  %m.gyroMode %m.whichInputPort',                 'readGyroPort',  'angle', '1'],
    //         ['R', 'motor %m.motorInputMode %m.whichMotorIndividual', 'readFromMotor', 'position', 'B'],

    //         //    ['R', 'battery level',   'readBatteryLevel'],
    //         //  [' ', 'reconnect', 'reconnectToDevice'],
    //     ],
    //     menus: {
    //         whichMotorPort: ['A', 'B', 'C', 'D', 'A+D', 'B+C'],
    //         whichMotorIndividual: ['A', 'B', 'C', 'D'],
    //         dualMotors: ['A+D', 'B+C'],
    //         turnStyle: ['forward', 'reverse', 'right', 'left'],
    //         breakCoast: ['break', 'coast'],
    //         lightSensorMode: ['reflected', 'ambient', 'color'],
    //         motorInputMode: ['position', 'speed'],
    //         gyroMode: ['angle', 'rate'],
    //         note: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "D6", "E6", "F6", "G6", "A6", "B6", "C#4", "D#4", "F#4", "G#4", "A#4", "C#5", "D#5", "F#5", "G#5", "A#5", "C#6", "D#6", "F#6", "G#6", "A#6"],
    //         whichInputPort: ['1', '2', '3', '4'],
    //         buttons: IRbuttonNames,
    //     },
    // };
    
    
    
    
    
    return Device;
} ());

var device = new Device();
device.tryToConnect();