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
                    device.startMotors('A', 50);
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
    
    // motor port bit field from menu choice string
    function getMotorBitsHexString(which) {
        if (which == "A")
            return "01";
        else if (which == "B")
            return "02";
        else if (which == "C")
            return "04";
        else if (which == "D")
            return "08";
        else if (which == "B+C")
            return "06";
        else if (which == "A+D")
            return "09";
        else if (which == "all")
            return "0F";

        return "00";
    }
    
    function getMotorIndex(which) {
        if (which == "A")
            return 4;
        else if (which == "B")
            return 5;
        else if (which == "C")
            return 6;
        else if (which == "D")
            return 7;
    }
    
    // int bytes using weird serialization method
    function getPackedOutputHexString(num, lc) {
        // nonsensical unsigned byte packing. see cOutputPackParam in c_output-c in EV3 firmware
        var a = new ArrayBuffer(4);
        var sarr = new Int32Array(a);
        var uarr = new Uint8Array(a);
        console.log('uarr: ' + uarr);
        sarr[0] = num;
        
        if (lc == 0) {
            var bits = uarr[0];
            bits &= 0x0000003F;
            return hexcouplet(bits);
        }
        else if (lc == 1) {
            return "81" + (uarr[0]);
        }
        else if (lc == 2) {
            return "82" + hexcouplet(uarr[0]) + hexcouplet(uarr[1]);
        }
        else if (lc == 3) {
            return "83" + hexcouplet(uarr[0]) + hexcouplet(uarr[1]) + hexcouplet(uarr[2]) + hexcouplet(uarr[3]);
        }
        
        return "00";
    }
    
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
            //console.log('str '+ i + ': ' + str);
        }
        return result;
    }
    
    function sendCommand(commandArray) {
        console.log('Command Array: ' +commandArray);
        if ((EV3Connected || connecting) && theEV3DevicePort) {
            //console.log("sending: " + createHexString(commandArray));
            //console.log(commandArray);
            theEV3DevicePort.write(commandArray, function (error) {
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
            console.log('The command is: ' + theCommand);
            if (thePendingQuery) {
                console.log('1');
                //we are waiting for a result
                if (thePendingQuery[0] == port) {
                    // special case: we are actually already in the process of querying this same sensor (should we also compare the type and mode, or maybe just match the command string?)
                    // so we don't want to bother calling it again
                    waitingQueries.shift();
                    if (callback) {
                        console.log('2');
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
            console.log('command before packing: ' + theCommand);
            //actually go ahead and make the query
            var packedCommand = packMessageForSending(theCommand);
            console.log('packed command: ' + packedCommand);
            sendCommand(packedCommand);
        }
        else if (query_info.length == 4) // a query with no response
        {
            if (thePendingQuery) {    // bail if we're waiting for a response
                console.log('lol what');
                return;
            }
            var type = query_info[0];
            var duration = query_info[1];
            var callback = query_info[2];
            var theCommand = query_info[3];
            
            if (type == DRIVE_QUERY || type == DRIVE_QUERY_DURATION) {
                clearDriveTimer();
                if (type == DRIVE_QUERY_DURATION) {
                    driveCallback = callback;   // save this callback in case timer is cancelled we can call it directly
                    driveTimer = setTimeout(function () {
                        if (duration > 0) // allow zero duration to run motors asynchronously
                        {
                            motorsStop('break'); // xxx
                        }
                        if (callback)
                            callback();
                    }, duration * 1000);
                }
            }
            else if (type == TONE_QUERY) {
                setTimeout(function () {
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
            console.log('checking waitingQueries.length');
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
        console.log("query_info: " + query_info);
        waitingQueries.push(query_info);
        console.log('waitingQueries length: ' + waitingQueries.length);
        executeQueryQueue();
    }
    
    //MOTOR FUNCTIONS
    
    Device.prototype.startMotors = function (which, speed) {
        clearDriveTimer();
        
        console.log('motor ' + which + " speed: " + speed);
        
        motorCommand = motor(which, speed);
        
        addToQueryQueue([DRIVE_QUERY, 0, null, motorCommand]);
        console.log("Added start motor. Queue length now: " + waitingQueries.length);
    }
    
    Device.prototype.motorDegrees = function (which, speed, degrees, howStop) {
        speed = capSpeed(speed);
        if (degrees < 0) {
            degrees *= -1;
            speed *= -1;
        }
        
        var motorBitField = getMotorBitsHexString(which);
        var speedBits = getPackedOutputHexString(speed, 1);
        var stepRampUpBits = getPackedOutputHexString(0, 3);
        var stepConstantBits = getPackedOutputHexString(degrees, 3);
        var stepRampDownBits = getPackedOutputHexString(0, 3);
        var howHex = getPackedOutputHexString(howStopCode(howStop), 1);
        
        var motorsCommand = createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_STEP_SPEED + motorBitField + speedBits
            + stepRampUpBits + stepConstantBits + stepRampDownBits + howHex
            + SET_MOTOR_START + motorBitField);
        
        addToQueryQueue([DRIVE_QUERY, 0, null, motorsCommand]);
    }
    
    Device.prototype.steeringControl = function (ports, what, duration, callback) {
        clearDriveTimer();
        var defaultSpeed = 50;
        var motorCommand = null;
        if (what == 'forward') {
            motorCommand = motor(ports, defaultSpeed);
        }
        else if (what == 'reverse') {
            motorCommand = motor(ports, defaultSpeed * -1);
        }
        else if (what == 'right') {
            motorCommand = motor2(ports, defaultSpeed);
        }
        else if (what == 'left') {
            motorCommand = motor2(ports, defaultSpeed * -1);
        }
        
        addToQueryQueue([DRIVE_QUERY_DURATION, duration, callback, motorCommand]);
    }
    
    function capSpeed (speed) {
        if (speed > 100) { speed = 100; }
        if (speed < -100) { speed = -100; }
        return speed;
    }
    
    function motor(which, speed) {
        speed = capSpeed(speed);
        var motorBitField = getMotorBitsHexString(which);
        console.log('got motorBitField: ' + motorBitField);
        var speedBits = getPackedOutputHexString(speed, 1);
        console.log('got speedBits: ' + speedBits);
        var motorsOnCommand = createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_SPEED + motorBitField + speedBits + SET_MOTOR_START + motorBitField);
        console.log('got motorsOnCommand: ' + motorsOnCommand);
        return motorsOnCommand;
    }
    
    
    function motor2(which, speed) {
        speed = capSpeed(speed);
        var p = which.split("+");
        
        var motorBitField1 = getMotorBitsHexString(p[0]);
        var motorBitField2 = getMotorBitsHexString(p[1]);
        var motorBitField = getMotorBitsHexString(which);
        
        var speedBits1 = getPackedOutputHexString(speed, 1);
        var speedBits2 = getPackedOutputHexString(speed * -1, 1);
        
        var motorsOnCommand = createMessage(DIRECT_COMMAND_PREFIX
            + SET_MOTOR_SPEED + motorBitField1 + speedBits1
            + SET_MOTOR_SPEED + motorBitField2 + speedBits2

            + SET_MOTOR_START + motorBitField);
        
        return motorsOnCommand;

    }
    
    var driveTimer = 0;
    //driveCallback = 0;
    
    function clearDriveTimer() {
        if (driveTimer) {
            clearInterval(driveTimer);
        }
        // if (driveCallback) {
        //     driveCallback();
        // }
        //driveCallback = 0;
    }
    
    Device.prototype.allMotorsOff = function (how) {
        clearDriveTimer();
        motorsStop(how);
    }
    
    function motorsStop(how) {
        console.log('motorsStop');
        
        var motorBitField = getMotorBitsHexString('A');
        console.log('motorstop motorBitField: ' + motorBitField);
        var howHex = getPackedOutputHexString(howStopCode(how), 1);
        console.log('motorstop howHex: ' + howHex);
        var motorsOffCommand = createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_STOP + motorBitField + howHex);
        console.log('motorstop command: ' + motorsOffCommand);
        addToQueryQueue([DRIVE_QUERY, 0, null, motorsOffCommand]);
    }
    
    function howStopCode(how) {
        if (how == 'break')
            return 1;
        else
            return 0;
    }
    
    //TONE FUNCTIONS
    
    //SENSOR FUNCTIONS
    
    //READ FUNCTIONS/METHODS
    
    
    
    
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
    
    
    
    
    
    return Device;
} ());

var device = new Device();
device.tryToConnect();