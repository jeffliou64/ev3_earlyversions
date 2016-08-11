//credit to ev3_scratch by kaspesla
//https://github.com/kaspesla/ev3_scratch/tree/gh-pages

var SerialPort = require('serialport');
var q = require('q');

var DEBUG_NO_EV3 = false; //not used
var theEV3DevicePort = theEV3DevicePort || null;
var EV3Connected = EV3Connected || false;
var potentialEV3Devices = potentialEV3Devices || [];
var lastCommandWeWereTrying = null;
var waitingCallbacks = waitingCallbacks || [[], [], [], [], [], [], [], [], []];
var waitingQueries = waitingQueries || [, , , , , ,];
var global_sensor_result = global_sensor_result || [0, 0, 0, 0, 0, 0, 0, 0, 0];
var thePendingQuery = thePendingQuery || null;

var connecting = connecting || false;
var warnedAboutBattery = warnedAboutBattery || false;
var counter = counter || 0;
var poller = poller || null;
var pingTimeout = pingTimeout || null;
var waitDuration = waitDuration || 0;
var driveTimer = 0;
var driveCallback = 0;

var waitingForPing = waitingForPing || false;
var waitingForInitialConnection = waitingForInitialConnection || false;

var DeviceError = (function () {
    function DeviceError(code, message) {
        this.code = code;
        this.message = message;
    }
    DeviceError.prototype.toString = function () {
        return "DeviceError(" + this.code + ") message: " + this.message;
    };
    DeviceError.REQUIRE_PAIRING = 401;
    DeviceError.DISCONNECTED_ERROR = 506;
    DeviceError.COMMAND_INCORRECT = 505;
    DeviceError.TURN_OFF = 507;
    return DeviceError;
}());

var Device = (function () {
    function Device(theEV3DevicePort) {
        var DEBUG_NO_EV3 = false;
        var theEV3DevicePort = theEV3DevicePort;
    };

    Device.tryToConnect = function (callerCallback) {
        console.log('tryToConnect()');
        Device.clearSensors();
        lastCommandWeWereTrying = waitingQueries.pop();
        waitingQueries = [];
        thePendingQuery = null;
        counter = 0;
        //var device;
        var promises = [];
        promises.push(Device.getPotentialEV3Devices());
        q.all(promises).then(function () {
            console.log('promises ok');

            potentialEV3Devices.forEach(function (serialport) {
                console.log('attempting to connect with ' + serialport.comName);
                connecting = true;
                var portToConnect = '/dev/tty.' + serialport.comName.substr(8);
                theEV3DevicePort = new SerialPort(portToConnect, baudRate = 56700, function (err) {
                    if (err) {
                        console.log('Error: ', err.message);
                        Device.disconnect();
                    }
                    var device = new Device(theEV3DevicePort);
                    theEV3DevicePort.on('data', function (result) {
                        device.receive_handler(result);
                    })
                    console.log('CONNECTED TO ' + theEV3DevicePort);
                    console.log('CONNECTED TO ' + serialport.comName);
                    EV3Connected = true;
                    connecting = false;
                    device.testTheConnection(device.startupBatteryCheckCallback(callerCallback));
                    waitingForInitialConnection = true;
                });
                if (!connecting && !EV3Connected) {
                    Device.disconnect();
                }
            });
        });
    };

    Device.getPotentialEV3Devices = function () { //NEEDS PROMISES AND THEN CALLBACK
        return q.Promise(function (resolve, reject, notify) {
            SerialPort.list(function (err, ports) {
                ports.forEach(function (port) {
                    console.log(port.comName);      //defined , string
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

    Device.clearSensors = function () {
        var numSensorBlocks = 9;
        for (x = 0; x < numSensorBlocks; x++) {
            waitingCallbacks[x] = [];
            global_sensor_result[x] = 0;
        }
    }

    Device.prototype.testTheConnection = function (theCallback) {
        this.readBatteryLevel(theCallback);
    }

    // Device.prototype.setupWatchdog = function () {
    //     if (poller)
    //         clearInterval(poller);
    //     poller = setInterval(this.pingBatteryWatchdog, 10000);
    // }

    // Device.prototype.pingBatteryWatchdog = function () {
    //     var device = this;
    //     console.log("pingBatteryWatchdog");
    //     device.testTheConnection(device.pingBatteryCheckCallback);
    //     waitingForPing = true;
    //     pingTimeout = setTimeout(device.pingTimeOutCallback, 3000);
    // }

    Device.disconnect = function () {
        theEV3DevicePort.close(function (error) {
            if (error) {
                return console.log('error: ' + error.message);
            };
            throw new DeviceError(DeviceError.TURN_OFF, "something something turn off");
        });
    };

    // Device.prototype.pingTimeOutCallback = function () {
    //     if (waitingForPing == true) {
    //         console.log('ping timed out');
    //         if (poller) {
    //             clearInterval(poller);
    //         }
    //         EV3Connected = false;
    //     }
    // }

    Device.prototype.endSequence = function () {
        console.log('we did it!');
        Device.disconnect();
    }

    Device.prototype.startupBatteryCheckCallback = function (callerCallback, result) {
        console.log('got battery level at connect: ' + result);
        waitingForInitialConnection = false;
        EV3Connected = true;
        connecting = false;
        var device = this;
        //this.playStartUpTones();

        if (result < 11 && !warnedAboutBattery) {
            alert('Your Battery is getting low. ');
            warnedAboutBattery = true;
        }
        setTimeout(function () {
            callerCallback(device);
        }, 1000);
        if (lastCommandWeWereTrying) {
            waitingQueries.push(lastCommandWeWereTrying);
            this.executeQueryQueue();
        }
    }

    Device.prototype.pingBatteryCheckCallback = function (result) {
        console.log('pinged battery level: ' + result);
        if (pingTimeout) {
            clearTimeout(pingTimeout);
        }
        waitingForPing = false;
        if (result < 11 && !warnedAboutBattery) {
            alert('Your battery is getting low.');
            warnedAboutBattery = true;
        }
    }

    Device.prototype.playStartUpTones = function () {
        var device = this;
        var tonedelay = 1000;
        setTimeout(function () {
            device.playFreqM2M(262, 150, 50);
        }, tonedelay);

        setTimeout(function () {
            device.playFreq(392, 150, 50, null);
        }, tonedelay + 150);

        setTimeout(function () {
            device.playTone('C5', 150, 50, null);
        }, tonedelay + 300);
    }

    Device.prototype.receive_handler = function (data) {
        var device = this;
        console.log(data);
        var inputData = new Uint8Array(data);
        console.log('received: ' + inputData);
        if (!(EV3Connected || connecting)) {
            console.log('received data but not connected or connecting');
            return;
        }
        if (!thePendingQuery) {
            console.log("received data but didn't expect it");
            return;
        }

        var theResult = null;
        var port = thePendingQuery[0];
        var type = thePendingQuery[1];
        var mode = thePendingQuery[2];
        var callback = thePendingQuery[3];
        var theCommand = thePendingQuery[4];

        if (type == TOUCH_SENSOR) {
            console.log('port: ' + port + 1);
            var result = inputData[5];
            theResult = (result == 100);
        }
        else if (type == COLOR_SENSOR) {
            console.log('port: ' + port + 1);
            var num = Math.floor(device.getFloatResult(inputData));
            console.log(num);
            if (mode == AMBIENT_INTENSITY || mode == REFLECTED_INTENSITY) {
                theResult = num;
            }
            else if (mode == COLOR_VALUE) {
                if (num >= 0 && num <= 7) {
                    theResult = colors[num];
                }
                else {
                    theResult = "none";
                }
            }
            else if (mode == COLOR_RAW_RGB) {
                var redValue = inputData[6];
                var greenValue = inputData[7];
                var blueValue = inputData[8];
                console.log('Red: ' + redValue + ", Green: " + greenValue + ', blue: ' + blueValue);
                //needs fixing and more understanding
            }
        }
        else if (type == IR_SENSOR) {
            console.log('port: ' + port + 1);
            if (mode == IR_PROX) {
                console.log('ollo');
                console.log('input data: ' + inputData);
                theResult = this.getFloatResult(inputData);
                console.log('float data: ' + theResult);
            }
            else if (mode == IR_REMOTE)
                theResult = this.getIRButtonNameForCode(this.getFloatResult(inputData));
        }
        else if (type == READ_FROM_MOTOR) {
            console.log('port: ' + this.getMotorName(port));
            theResult = this.getFloatResult(inputData);
            if (mode == '01') {
                console.log('net # of degrees turned: ' + theResult * 360);
            }
        }
        else if (type == UIREAD) {
            if (mode == UIREAD_BATTERY) {
                console.log('port: UI');
                theResult = inputData[5];
                console.log("Battery Level: " + theResult);
            }
        }

        global_sensor_result[port] = theResult;

        // do the callback
        console.log("result: " + theResult);
        if (callback)
            callback(theResult);

        while (callback = waitingCallbacks[port].shift()) {
            console.log("result (coalesced): " + theResult);
            callback(theResult);
        }

        console.log('');
        // done with this query
        thePendingQuery = null;
        // go look for the next query
        this.executeQueryQueueAgain();
    }

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
    var READ_MOTOR_SPINS = "01";
    var READ_MOTOR_SPEED = "02";

    var DRIVE_QUERY = "DRIVE_QUERY";
    var DRIVE_QUERY_DURATION = "DRIVE_QUERY_DURATION";
    var TONE_QUERY = "TONE_QUERY";

    // motor port bit field from menu choice string
    Device.prototype.getMotorBitsHexString = function (ports) {
        if (ports == "A")
            return "01";
        else if (ports == "B")
            return "02";
        else if (ports == "C")
            return "04";
        else if (ports == "D")
            return "08";
        else if (ports == "B+C")
            return "06";
        else if (ports == "A+D")
            return "09";
        else if (ports == "all")
            return "0F";
        return "00";
    }

    Device.prototype.getMotorIndex = function (ports) {
        if (ports == "A")
            return 4;
        else if (ports == "B")
            return 5;
        else if (ports == "C")
            return 6;
        else if (ports == "D")
            return 7;
    }

    Device.prototype.getMotorName = function (ports) {
        if (ports == 4)
            return 'A';
        else if (ports == 5)
            return 'B';
        else if (ports == 6)
            return 'C';
        else if (ports == 7)
            return 'D';
    }

    Device.prototype.hexcouplet = function (num) {
        var str = num.toString(16);
        str = str.toUpperCase();
        if (str.length == 1) {
            return "0" + str;
        }
        return str;
    }

    Device.prototype.getFloatResult = function (inputData) {
        var a = new ArrayBuffer(4);
        var c = new Float32Array(a);
        var arr = new Uint8Array(a);
        arr[0] = inputData[5];
        arr[1] = inputData[6];
        arr[2] = inputData[7];
        arr[3] = inputData[8];
        return c[0];
    }

    // int bytes using weird serialization method
    Device.prototype.getPackedOutputHexString = function (num, lc) {
        // nonsensical unsigned byte packing. see cOutputPackParam in c_output-c in EV3 firmware
        var a = new ArrayBuffer(4);
        var sarr = new Int32Array(a);
        var uarr = new Uint8Array(a);
        sarr[0] = num;

        if (lc == 0) {
            var bits = uarr[0];
            bits &= 0x0000003F;
            return this.hexcouplet(bits);
        }
        else if (lc == 1) {
            return "81" + this.hexcouplet(uarr[0]);
        }
        else if (lc == 2) {
            return "82" + this.hexcouplet(uarr[0]) + this.hexcouplet(uarr[1]);
        }
        else if (lc == 3) {
            return "83" + this.hexcouplet(uarr[0]) + this.hexcouplet(uarr[1]) + this.hexcouplet(uarr[2]) + this.hexcouplet(uarr[3]);
        }
        return "00";
    }

    Device.prototype.getIRButtonNameForCode = function (inButtonCode) {
        for (var i = 0; i < IRbuttonCodes.length; i++) {
            if (inButtonCode == IRbuttonCodes[i]) {
                return IRbuttonNames[i];
            }
        }
        return "none";
    }

    Device.prototype.createMessage = function (str) {
        return str;
    }

    Device.prototype.packMessageForSending = function (str) {
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
        return mess;
    }

    Device.prototype.sendCommand = function (commandArray) {
        if ((EV3Connected || connecting) && theEV3DevicePort) {
            theEV3DevicePort.write(commandArray, function (error) {
                if (error) {
                    console.log('error: ' + error);
                }
            });
        }
        else {
            console.log("sendCommand called when not connected");
        }
    }

    Device.prototype.executeQueryQueueAgain = function () {
        var device = this;
        setTimeout(function () {
            device.executeQueryQueue();
        }, 10);
    }

    Device.prototype.executeQueryQueue = function (ports) {
        var device = this;
        if (waitingQueries.length == 0) {
            return;
        }

        if (!EV3Connected && !connecting) {
            console.log('executeQueryQueue() called with no connection');
            if (theEV3DevicePort && !connecting) {
                this.tryToConnect();
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
                    if (thePendingQuery[4] == theCommand) {
                        waitingQueries.shift();
                        if (callback) {
                            waitingCallbacks[port].push(callback);
                        }
                    }
                    return;
                }
                //do nothing. we'll try again after the query finishes
                return;
            }

            waitingQueries.shift(); //remove it from the queue
            thePendingQuery = query_info;
            console.log('command before packing: ' + theCommand);
            var packedCommand = device.packMessageForSending(theCommand);
            console.log('packed command: ' + packedCommand);
            device.sendCommand(packedCommand);
        }
        else if (query_info.length == 4) // a query with no response
        {
            if (thePendingQuery) {    // bail if we're waiting for a response
                console.log('lol what');
                device.executeQueryQueueAgain();
                return;
            }
            var type = query_info[0];
            var duration = query_info[1];
            var callback = query_info[2];
            var theCommand = query_info[3];

            if (type == DRIVE_QUERY || type == DRIVE_QUERY_DURATION) {
                device.clearDriveTimer();
                if (type == DRIVE_QUERY_DURATION) {
                    driveCallback = callback;   // save this callback in case timer is cancelled we can call it directly
                    driveTimer = setTimeout(function () {
                        if (duration > 0) // allow zero duration to run motors asynchronously
                        {
                            device.motorsStop('break', ports); // xxx
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

            console.log('command before packing: ' + theCommand);
            var packedCommand = device.packMessageForSending(theCommand);
            console.log('packed command: ' + packedCommand);
            device.sendCommand(packedCommand);

            device.executeQueryQueueAgain();   // maybe do the next one
        }
    }

    Device.prototype.addToQueryQueue = function (query_info, ports) {
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
            }
        }
        waitingQueries.push(query_info);
        console.log('waitingQueries length: ' + waitingQueries.length);
        this.executeQueryQueue(ports);
    }

    //MOTOR FUNCTIONS
    Device.prototype.startMotors = function (ports, speed) {
        this.clearDriveTimer();
        console.log('motor ' + ports + " speed: " + speed);
        var motorCommand = this.motor(ports, speed);

        this.addToQueryQueue([DRIVE_QUERY, 0, null, motorCommand]);
        console.log("Added start motor. Queue length now: " + waitingQueries.length);
    }

    Device.prototype.motorDegrees = function (ports, speed, degrees, howStop) {
        speed = this.capSpeed(speed);
        if (degrees < 0) {
            degrees *= -1;
            speed *= -1;
        }
        var motorBitField = this.getMotorBitsHexString(ports);
        var speedBits = this.getPackedOutputHexString(speed, 1);
        var stepRampUpBits = this.getPackedOutputHexString(0, 3);
        var stepConstantBits = this.getPackedOutputHexString(degrees, 3);
        var stepRampDownBits = this.getPackedOutputHexString(0, 3);
        var howHex = this.getPackedOutputHexString(this.howStopCode(howStop), 1);

        var motorsCommand = this.createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_STEP_SPEED + motorBitField + speedBits
            + stepRampUpBits + stepConstantBits + stepRampDownBits + howHex
            + SET_MOTOR_START + motorBitField);

        this.addToQueryQueue([DRIVE_QUERY, 0, null, motorsCommand]);
    }

    Device.prototype.steeringControl = function (ports, what, speed, duration, callback) {
        this.clearDriveTimer();
        speed = this.capSpeed(speed);
        var motorCommand = null;
        if (what == 'forward')
            motorCommand = this.motor(ports, speed)
        else if (what == 'reverse')
            motorCommand = this.motor(ports, speed * -1)
        else if (what == 'right')
            motorCommand = this.motor2(ports, speed);
        else if (what == 'left')
            motorCommand = this.motor2(ports, speed * -1)
        this.addToQueryQueue([DRIVE_QUERY_DURATION, duration, callback, motorCommand], ports);
    }

    Device.prototype.capSpeed = function (speed) {
        if (speed > 100) { speed = 100; }
        if (speed < -100) { speed = -100; }
        return speed;
    }

    Device.prototype.motor = function (ports, speed) {
        speed = this.capSpeed(speed);
        var motorBitField = this.getMotorBitsHexString(ports);
        console.log('got motorBitField: ' + motorBitField);
        var speedBits = this.getPackedOutputHexString(speed, 1);
        console.log('got speedBits: ' + speedBits);
        var motorsOnCommand = this.createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_SPEED + motorBitField + speedBits + SET_MOTOR_START + motorBitField);
        console.log('got motorsOnCommand: ' + motorsOnCommand);
        return motorsOnCommand;
    }

    Device.prototype.motor2 = function (ports, speed) {
        speed = this.capSpeed(speed);
        var port = ports.split("+");

        var motorBitField1 = this.getMotorBitsHexString(port[0]);
        var motorBitField2 = this.getMotorBitsHexString(port[1]);
        var motorBitField = this.getMotorBitsHexString(ports);
        var speedBits1 = this.getPackedOutputHexString(speed, 1);
        var speedBits2 = this.getPackedOutputHexString(speed * -1, 1);

        var motorsOnCommand = this.createMessage(DIRECT_COMMAND_PREFIX
            + SET_MOTOR_SPEED + motorBitField1 + speedBits1
            + SET_MOTOR_SPEED + motorBitField2 + speedBits2
            + SET_MOTOR_START + motorBitField);

        return motorsOnCommand;
    }

    Device.prototype.clearDriveTimer = function () {
        if (driveTimer) {
            clearInterval(driveTimer);
        }
        if (driveCallback) {
            driveCallback();
        }
        driveCallback = 0;
    }

    Device.prototype.allMotorsOff = function (how) {
        this.clearDriveTimer();
        this.motorsStop(how, 'all');
    }

    Device.prototype.motorsStop = function (how, ports) {
        console.log('motorsStop');

        var motorBitField = this.getMotorBitsHexString(ports);
        console.log('motorstop motorBitField: ' + motorBitField);
        var howHex = this.getPackedOutputHexString(this.howStopCode(how), 1);
        console.log('motorstop howHex: ' + howHex);
        var motorsOffCommand = this.createMessage(DIRECT_COMMAND_PREFIX + SET_MOTOR_STOP + motorBitField + howHex);
        console.log('motorstop command: ' + motorsOffCommand);
        this.addToQueryQueue([DRIVE_QUERY, 0, null, motorsOffCommand]);
    }

    Device.prototype.howStopCode = function (how) {
        if (how == breakTypes[0])
            return 1;
        else
            return 0;
    }

    //TONE FUNCTIONS w/ identification arrays
    var frequencies = {
        "C4": 262, "D4": 294, "E4": 330, "F4": 349, "G4": 392, "A4": 440, "B4": 494,
        "C5": 523, "D5": 587, "E5": 659, "F5": 698, "G5": 784, "A5": 880, "B5": 988,
        "C6": 1047, "D6": 1175, "E6": 1319, "F6": 1397, "G6": 1568, "A6": 1760, "B6": 1976,
        "C#4": 277, "D#4": 311, "F#4": 370, "G#4": 415, "A#4": 466,
        "C#5": 554, "D#5": 622, "F#5": 740, "G#5": 831, "A#5": 932,
        "C#6": 1109, "D#6": 1245, "F#6": 1480, "G#6": 1661, "A#6": 1865
    }

    var colors = ['none', 'black', 'blue', 'green', 'yellow', 'red', 'white', 'brown'];
    var IRbuttonNames = ['Top Left', 'Bottom Left', 'Top Right', 'Bottom Right', 'Top Left & Top Right', 'Top Left & Bottom Right', 'Bottom Left & Top Right', 'Bottom Left & Bottom Right', 'Top Bar', 'Top Left & Bottom Left', 'Top Right & Bottom Right'];
    var IRbuttonCodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var breakTypes = ["Break", "other"];

    Device.prototype.playTone = function (tone, duration, volume, callback) {
        var vol = this.capVolume(volume);
        var freq = frequencies[tone];
        console.log('playTone: ' + tone + ' duration: ' + duration + ' freq: ' + freq);
        var volString = this.getPackedOutputHexString(vol, 1);
        var freqString = this.getPackedOutputHexString(freq, 2);
        var durString = this.getPackedOutputHexString(duration, 2);

        var toneCommand = this.createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);
        this.addToQueryQueue([TONE_QUERY, duration, callback, toneCommand]);
    }

    Device.prototype.playFreq = function (freq, duration, volume, callback) {
        var vol = this.capVolume(volume);
        console.log('playFreq duration: ' + duration + ' freq: ' + freq);
        var volString = this.getPackedOutputHexString(vol, 1);
        var freqString = this.getPackedOutputHexString(freq, 2);
        var durString = this.getPackedOutputHexString(duration, 2);

        var toneCommand = this.createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);
        this.addToQueryQueue([TONE_QUERY, duration, callback, toneCommand]);
    }

    Device.prototype.playFreqM2M = function (freq, duration, volume) {
        var vol = this.capVolume(volume);
        console.log('playFreqM2M duration: ' + duration + ' freq: ' + freq);
        var volString = this.getPackedOutputHexString(vol, 1);
        var freqString = this.getPackedOutputHexString(freq, 2);
        var durString = this.getPackedOutputHexString(duration, 2);

        var toneCommand = this.createMessage(DIRECT_COMMAND_PREFIX + PLAYTONE + volString + freqString + durString);
        this.addToQueryQueue([TONE_QUERY, 0, null, toneCommand]);
    }

    Device.prototype.capVolume = function (volume) {
        if (volume > 100) { volume = 100; }
        else if (volume < 0) { volume = 0; }
        return volume;
    }

    //READ FUNCTIONS
    Device.prototype.whenButtonPressed = function (port) { //currently reads from touch sensor from declared port
        if (!theEV3DevicePort || !EV3Connected) {
            return false;
        }
        var portInt = parseInt(port) - 1;
        this.readTouchSensor(portInt, null);
        return global_sensor_result[portInt];
    }

    Device.prototype.whenRemoteButtonPressed = function (IRButton, port) { //reads from IRremote Sensor (not sure if waits or auto reads) 
        if (!theEV3DevicePort || !EV3Connected) {
            return false;
        }
        var portInt = parseInt(port) - 1;
        this.readIRRemoteSensor(portInt, null);
        return (global_sensor_result[portInt] == IRButton);
    }

    Device.prototype.readDistanceSensorPort = function (port, callback) {
        var portInt = parseInt(port) - 1;
        this.readFromSensors(portInt, IR_SENSOR, IR_PROX, callback);
    }

    Device.prototype.readRemoteButtonPort = function (port, callback) {
        var portInt = parseInt(port) - 1;
        this.readIRRemoteSensor(portInt, callback);
    }

    Device.prototype.readTouchSensorPort = function (port, callback) {
        var portInt = parseInt(port) - 1;
        this.readTouchSensor(portInt, callback);
    }

    Device.prototype.readColorSensorPort = function (port, mode, callback) {
        var modeCode = AMBIENT_INTENSITY;
        if (mode == 'reflected') { modeCode = REFLECTED_INTENSITY; }
        if (mode == 'color') { modeCode = COLOR_VALUE; }
        if (mode == 'RGBcolor') { modeCode = COLOR_RAW_RGB; }

        console.log('port: ' + port + ', mode: ' + mode + ', callback: ' + callback);
        var portInt = parseInt(port) - 1;
        this.readFromColorSensor(portInt, modeCode, callback);
    }

    Device.prototype.readFromMotor = function (mmode, ports, callback) {
        var portInt = this.getMotorIndex(ports);
        var mode = READ_MOTOR_SPINS;
        if (mmode == 'speed') {
            mode = READ_MOTOR_SPEED;
        }
        this.readFromSensors(portInt, READ_FROM_MOTOR, mode, callback);
    }

    var lineCheckingInterval = 0;
    Device.prototype.waitUntilDarkLine = function (port, callback) {
        var device = this;
        if (lineCheckingInterval)
            clearInterval(lineCheckingInterval);
        lineCheckingInterval = 0;
        var modeCode = REFLECTED_INTENSITY;
        var portInt = parseInt(port) - 1;
        global_sensor_result[portInt] = -1;

        lineCheckingInterval = setInterval(function () {
            device.readFromColorSensor(portInt, modeCode, null);
            if (global_sensor_result[portInt] < 8 && global_sensor_result[portInt] >= 0) {
                clearInterval(lineCheckingInterval);
                lineCheckingInterval = 0;
                callback;
            }
        }, 100);
    }

    Device.prototype.readBatteryLevel = function (callback) {
        console.log('going to read battery level');
        var portInt = 8; //bogus port number
        this.readFromSensors(portInt, UIREAD, UIREAD_BATTERY, callback);
    }

    Device.prototype.readTouchSensor = function (portInt, callback) {
        this.readFromSensors(portInt, TOUCH_SENSOR, mode0, callback);
    }

    Device.prototype.readIRRemoteSensor = function (portInt, callback) {
        this.readFromSensors(portInt, IR_SENSOR, IR_REMOTE, callback);
    }

    Device.prototype.readFromColorSensor = function (portInt, modeCode, callback) {
        this.readFromSensors(portInt, COLOR_SENSOR, modeCode, callback);
    }

    Device.prototype.readFromSensors = function (port, type, mode, callback) {
        var theCommand = null;
        switch (type) {
            case TOUCH_SENSOR:
                theCommand = this.createMessage(DIRECT_COMMAND_REPLY_PREFIX +
                    READ_SENSOR + this.hexcouplet(port) + type + mode + '60');
                this.addToQueryQueue([port, type, mode, callback, theCommand]);
                break;
            case COLOR_SENSOR:
                theCommand = this.createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
                    INPUT_DEVICE_READY_SI + "00" + // layer
                    this.hexcouplet(port) + "00" + // type
                    mode + "0160");
                this.addToQueryQueue([port, type, mode, callback, theCommand]);
                break;
            case IR_SENSOR:
                theCommand = this.createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
                    INPUT_DEVICE_READY_SI + "00" + // layer
                    this.hexcouplet(port) + "00" + // type
                    mode + "0160");
                this.addToQueryQueue([port, type, mode, callback, theCommand]);
                break;
            case READ_FROM_MOTOR:
                theCommand = this.createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
                    INPUT_DEVICE_READY_SI + "00" + // layer
                    this.hexcouplet(port + 12) + "00" + // type
                    mode + "0160");
                this.addToQueryQueue([port, type, mode, callback, theCommand]);
                break;
            case UIREAD:
                theCommand = this.createMessage(DIRECT_COMMAND_REPLY_PREFIX +
                    UIREAD + mode + "60");
                this.addToQueryQueue([port, type, mode, callback, theCommand]);
                break;
            default:
                console.log('dafuq is this');
                break;
        }
    }

    return Device;
} ());

module.exports = Device;