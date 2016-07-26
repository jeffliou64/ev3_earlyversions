
var sensorWatchDogInfo = sensorWatchDogInfo || [null, null, null, null];
var sensorType = sensorType || null;
var touchPoller = touchPoller || null;
var colorPoller = colorPoller || null;
var IRPoller = IRPoller || null;
var GYROPoller = GYROPoller || null;
var MOTORPoller = MOTORPoller || null;
var UIPoller = UIPoller || null;

            // if (touchPoller) {
            //     clearInterval(touchPoller);
            // }
            // if (colorPoller) {
            //     clearInterval(colorPoller);
            // }
            // if (IRPoller) {
            //     clearInterval(IRPoller);
            // }
            // if (GYROPoller) {
            //     clearInterval(GYROPoller);
            // }
            // if (MOTORPoller) {
            //     clearInterval(MOTORPoller);
            // }
            // if (UIPoller) {
            //     clearInterval(UIPoller);
            // }


function setupSensorWatchdog(type, port, mode, callback) {
        console.log('checking sensor: ' + sensorType);
        if (touchPoller) {
            clearInterval(touchPoller);
        }
        if (colorPoller) {
            clearInterval(colorPoller);
        }
        if (IRPoller) {
            clearInterval(IRPoller);
        }
        if (GYROPoller) {
            clearInterval(GYROPoller);
        }
        if (MOTORPoller) {
            clearInterval(MOTORPoller);
        }
        if (UIPoller) {
            clearInterval(UIPoller);
        }
        
        sensorWatchDogInfo[0] = type;
        sensorWatchDogInfo[1] = port + 1;
        sensorWatchDogInfo[2] = mode;
        sensorWatchDogInfo[3] = callback;
        
        if (type == TOUCH_SENSOR) {
            touchPoller = setInterval(pingTouchWatchdog, 2000);
        }
        else if (type == COLOR_SENSOR) {
            console.log('sensortype: ' + type);
            colorPoller = setInterval(pingColorWatchdog, 2000);
        }
        else if (type == IR_SENSOR) {
            IRPoller = setInterval(pingIRWatchdog, 2000);
        }
        else if (type == GYRO_SENSOR) {
            GYROPoller = setInterval(SensorWatchdog, 2000);
        }
        else if (type == READ_FROM_MOTOR) {
            MOTORPoller = setInterval(pingMotorWatchdog, 2000);
        }
        // else if (sensorType == UIREAD) {
        //     UIPoller = setInterval(SensorWatchdog, 2000);
        // }
    }
    
    function pingTouchWatchdog() {
        console.log("pingTouchWatchdog");
        SensorWatchdog();
        console.log('apple');
        waitingForPing = true;
        pingTimeout = setTimeout(pingTimeOutCallback, 3000);
    }
    
    function pingColorWatchdog() {
        console.log("pingColorWatchdog");
        SensorWatchdog();
        waitingForPing = true;
        pingTimeout = setTimeout(pingTimeOutCallback, 3000);
    }
    
    function pingIRWatchdog() {
        console.log("pingIRWatchdog");
        SensorWatchdog();
        waitingForPing = true;
        pingTimeout = setTimeout(pingTimeOutCallback, 3000);
    }
    
    function pingMotorWatchdog() {
        console.log("pingMotorWatchdog");
        SensorWatchdog();
        waitingForPing = true;
        pingTimeout = setTimeout(pingTimeOutCallback, 3000);
    }
    
    function SensorWatchdog() {
        var type = sensorWatchDogInfo[0];
        var port = sensorWatchDogInfo[1];
        var mode = sensorWatchDogInfo[2];
        var callback = sensorWatchDogInfo[3];
        console.log('type: ' + type + ', port: ' + port + ', mode: ' + mode + ', callback: ' + callback);
        if (type == TOUCH_SENSOR) {
            device.readTouchSensorPort(port, callback);
        }
        else if (type == COLOR_SENSOR) {
            device.readColorSensorPort(port, mode, callback);
        }
        else if (type == IR_SENSOR) {
            device.readDistanceSensorPort(port, callback);
        }
        else if (type == GYRO_SENSOR) {
            console.log('need to be implemented...? (gyro)');
        }
        else if (type == READ_FROM_MOTOR) {
            device.readFromMotor(mode, port, callback);
        }
        // else if (type == UIREAD) {
        //     console.log('need to be implemented...? (battery)');
        // }
    }
    
    console.log('SETUP SENSOR WATCHDOG');
    sensorType = type;
    setupSensorWatchdog(type, port, mode, callback);
    console.log('type: ' + type + ', port: ' + port + ', mode: ' + mode + ', callback: ' + callback);
    
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    Device.prototype.whenButtonPressed = function (port) { //currently reads from touch sensor from declared port
        if (!theEV3DevicePort || !EV3Connected) {
            return false;
        }
        var portInt = parseInt(port) - 1;
        readTouchSensor(portInt, null);
        return global_sensor_result[portInt];
    }

    Device.prototype.whenRemoteButtonPressed = function (IRButton, port) { //reads from IRremote Sensor (not sure if waits or auto reads) 
        if (!theEV3DevicePort || !EV3Connected) {
            return false;
        }
        var portInt = parseInt(port) - 1;
        readIRRemoteSensor(portInt, null);


        return (global_sensor_result[portInt] == IRButton);
    }

    Device.prototype.readDistanceSensorPort = function (port, callback) {
        var portInt = parseInt(port) - 1;

        readFromSensor2(portInt, IR_SENSOR, IR_PROX, callback);
    }

    Device.prototype.readRemoteButtonPort = function (port, callback) {
        var portInt = parseInt(port) - 1;

        readIRRemoteSensor(portInt, callback);
    }

    Device.prototype.readTouchSensorPort = function (port, callback) {
        var portInt = parseInt(port) - 1;
        readTouchSensor(portInt, callback);
    }

    Device.prototype.readColorSensorPort = function (port, mode, callback) {
        var modeCode = AMBIENT_INTENSITY;
        if (mode == 'reflected') { modeCode = REFLECTED_INTENSITY; }
        if (mode == 'color') { modeCode = COLOR_VALUE; }
        if (mode == 'RGBcolor') { modeCode = COLOR_RAW_RGB; }

        console.log('port: ' + port + ', mode: ' + mode + ', callback: ' + callback);
        var portInt = parseInt(port) - 1;
        readFromColorSensor(portInt, modeCode, callback);
    }

    Device.prototype.readFromMotor = function (mmode, which, callback) {
        var portInt = getMotorIndex(which);
        var mode = "01";
        if (mmode == 'speed') {
            mode = "02";
        }
        readFromAMotor(portInt, READ_FROM_MOTOR, mode, callback);
    }

    function readBatteryLevel(callback) {
        console.log('going to read battery level');
        var portInt = 8; //bogus port number
        UIRead(portInt, UIREAD_BATTERY, callback);
    }

    function readTouchSensor(portInt, callback) {
        readFromSensor(portInt, TOUCH_SENSOR, mode0, callback);
    }

    function readIRRemoteSensor(portInt, callback) {
        readFromSensor2(portInt, IR_SENSOR, IR_REMOTE, callback);
    }

    function readFromColorSensor(portInt, modeCode, callback) {
        readFromSensor2(portInt, COLOR_SENSOR, modeCode, callback);
    }

    function readFromSensor(port, type, mode, callback) {
        var theCommand = createMessage(DIRECT_COMMAND_REPLY_PREFIX +
            READ_SENSOR +
            hexcouplet(port) +
            type +
            mode + '60');

        addToQueryQueue([port, type, mode, callback, theCommand]);
    }

    function readFromSensor2(port, type, mode, callback) {
        var theCommand = createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
            INPUT_DEVICE_READY_SI + "00" + // layer
            hexcouplet(port) + "00" + // type
            mode +
            "0160"); // result stuff

        addToQueryQueue([port, type, mode, callback, theCommand]);
    }

    function readFromAMotor(port, type, mode, callback) {
        var theCommand = createMessage(DIRECT_COMMAND_REPLY_SENSOR_PREFIX +
            INPUT_DEVICE_READY_SI + "00" + // layer
            hexcouplet(port + 12) + "00" + // type
            mode +
            "0160"); // result stuff

        addToQueryQueue([port, type, mode, callback, theCommand]);
    }

    function UIRead(port, subtype, callback) {
        var theCommand = createMessage(DIRECT_COMMAND_REPLY_PREFIX +
            UIREAD + subtype +
            "60");

        addToQueryQueue([port, UIREAD, subtype, callback, theCommand]);
    }
