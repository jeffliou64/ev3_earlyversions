
var sensorWatchDogInfo = sensorWatchDogInfo || [null, null, null, null];
var sensorType = sensorType || null;
var touchPoller = touchPoller || null;
var colorPoller = colorPoller || null;
var IRPoller = IRPoller || null;
var GYROPoller = GYROPoller || null;
var MOTORPoller = MOTORPoller || null;
var UIPoller = UIPoller || null;

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