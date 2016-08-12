var SerialPort = require('serialport');
var q = require('q');
var EV3 = require("../V2.0.js");
var readline = require('readline');

var speed = 0;          // -100 to 100
var duration = 0;       // in msec
var mode = null;        // 
var direction = null;   // forward/reverse/left/right
var motorport = null;   // A/B/C/D/ A+D/B+C
var readport = null;    // 1/2/3/4
var tone = null;        // look at frequency array
var freq = 0;           // any number
var volume = 0;         // 0 to 100
var poller = 0;         // may not need, could be removed
var hasCallback = false;
var theResultArray = [];
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
var readMotorTypes = ["forward", "reverse", "left", "right"];

var rl = readline.createInterface(process.stdin, process.stdout);

EV3.tryToConnect(function (device) {
    if (poller)
        clearInterval(poller);
    //poller = setInterval(device.testTheConnection(device.pingBatteryCheckCallback), 10000);
    console.log('CONNECTED WOOOOOOHHOOOOOOOO');
    setTimeout(function () {
        userInterface(device);
    }, 2000);
});

function userInterface(device) {
    hasCallback = false;
    var listOfCommands = [
            ["01. playTone"],
            ["02. play Frequency"],
            ["03. play Frequency 2"],
            ["04. Start moving Motor"],
            ["05. turn motor by certain degrees"],
            ["06. turn on motor for certain time"],
            ["07. turn off all motors"],
            ["08. read IR Distance sensor"],
            ["09. read Touch sensor"],
            ["10. read Color sensor (color)"],
            ["11. read Color sensor (ambient intensity)"],
            ["12. read Color sensor (reflected intensity)"],
            ["13. read from Motor"],
            ["14. wait until Dark line"],
            ["15. read battery level"],
            ["16. read beacon button (CH 1)"],
            // ["17. "],
            // ["18. "],
            // ["19. "],
            ["20. disconnect from EV3 (end program)"]
        ];
    listOfCommands.forEach(function(func, i) {
        console.log("[" + i + "]. " + func[0]);
    });
    rl.question("What command to add: ", function (selectedmode) {
        switch (selectedmode) {
            case "01":
                //playTone = function(tone, duration (msec), 0-100, callback)
                device.playTone("C4", 2000, 100, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "02":
                //playFreq = function(frequency, duration (msec), 0-100, callback)
                device.playFreq(523, 1000, 100, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "03":
                //playFreqM2M = function(frequency, duration (msec), 0-100)
                device.playFreqM2M(1047, 1000, 100); break;
            case "04":
                //startMotors = function (A/B/C/D/A+D/B+C, 0-100)
                device.startMotors("A", 100); break;
            case "05":
                //motorDegrees = function (A/B/C/D/A+D/B+C, 0-100, degrees, Break/<any other phrase>) 
                device.motorDegrees("A", 20, 90, "Break"); break;
            case "06":
                //steeringControl = function (A/B/C/D/A+D/B+C, forward/reverse/left/right, 0-100, duration (msec), callback)
                device.steeringControl("A", "forward", 100, 1000, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "07":
                //allMotorsOff = function (Break/<any other phrase>)
                device.allMotorsOff("Break"); break;
            case "08":
                //readDistanceSensorPort = function (1/2/3/4, callback)
                device.readDistanceSensorPort(1, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "09":
                //readTouchSensorPort = function (1/2/3/4, callback)
                device.readTouchSensorPort(2, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "10":
                //readColorSensorPort = function (1/2/3/4, "color", callback) 
                device.readColorSensorPort(3, 'color', ReceivedResultCallback);
                hasCallback = true;
                break;
            case "11":
                //readColorSensorPort = function (1/2/3/4, "ambient", callback) 
                device.readColorSensorPort(3, 'ambient', ReceivedResultCallback);
                hasCallback = true;
                break;
            case "12":
                //readColorSensorPort = function (1/2/3/4, "reflected", callback) 
                device.readColorSensorPort(3, 'reflected', ReceivedResultCallback);
                hasCallback = true;
                break;
            case "13":
                //readFromMotor = function (<spins>/"speed", A/B/C/D, callback) 
                device.readFromMotor("any", "A", ReceivedResultCallback);
                hasCallback = true;
                break;
            case "14":
                //waitUntilDarkLine = function (1/2/3/4, callback) 
                device.waitUntilDarkLine(3, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "15":
                //readBatteryLevel = function (callback)
                device.readBatteryLevel(ReceivedResultCallback);
                hasCallback = true;
                break;
            case "16":
                //whenRemoteButtonPressed = function (IRButton, 1/2/3/4, callback)
                device.whenRemoteButtonPressed("null", 1, ReceivedResultCallback);
                hasCallback = true;
                break;
            case "20":
                //endSequence = function ()
                device.endSequence(); break;
            default:
                console.log("no"); break;
        }
        if (hasCallback == false) {
            userInterface(device);
        }
    })
};

function ReceivedResultCallback(device, theResult) {
    console.log("Result: " + theResult);
    theResultArray.push(theResult);
    userInterface(device);
}

    // MOTOR FUNCTIONS
    // Device.prototype.startMotors = function (ports, speed)
    // Device.prototype.motorDegrees = function (ports, speed, degrees, howStop)
    // Device.prototype.steeringControl = function (ports, what, speed, duration, callback)
    // Device.prototype.allMotorsOff = function (how)
    // SOUND FUNCTIONS
    // function playTone(tone, duration, volume, callback)
    // function playFreq(freq, duration, volume, callback)
    // function playFreqM2M(freq, duration, volume)
    // READ FUNCTIONS
    // Device.prototype.whenButtonPressed = function (port)
    // Device.prototype.whenRemoteButtonPressed = function (IRButton, port)
    // Device.prototype.readDistanceSensorPort = function (port, callback)
    // Device.prototype.readRemoteButtonPort = function (port, callback)
    // Device.prototype.readTouchSensorPort = function (port, callback)
    // Device.prototype.readColorSensorPort = function (port, mode, callback)
    // Device.prototype.readFromMotor = function (mmode, ports, callback)
    // Device.prototype.waitUntilDarkLine = function (port, callback)
    // Device.prototype.readBatteryLevel = function (callback)