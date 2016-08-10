var SerialPort = require('serialport');
var q = require('q');
var EV3 = require("../V1.2.js");
var readline = require('readline');

var speed = 0;
var duration = 0;
var mode = null;
var direction = null;
var port = null;
var tone = null;
var freq = 0;
var volume = 0;
var poller = 0;

var rl = readline.createInterface(process.stdin, process.stdout);

EV3.tryToConnect(function (device) {
    if (poller)
            clearInterval(poller);
    //poller = setInterval(device.testTheConnection(device.pingBatteryCheckCallback), 10000);
    console.log('CONNECTED WOOOOOOHHOOOOOOOO');
    setTimeout(function () {
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
            ["15. read battery level"]
        ];
        userInterface(device, listOfCommands);
    }, 2000);
});
// list options (what to do)
// ask for port, ask for [speed, duration, mode, direction, port]
// OR ask for [tone/freq, duration, volume]
function userInterface(device, list) {
    list.forEach(function(func, i) {
        console.log("[" + i + "]. " + func[0]);
    });
    rl.question("What command to add: ", function (selectedmode) {
        switch (selectedmode) {
            case "01":
                //playTone = function(tone, duration (msec), 0-100, callback)
                device.playTone("C4", 1000, 100, null);
                break;
            case "02":
                //playFreq = function(frequency, duration (msec), 0-100, callback)
                device.playFreq(523, 1000, 100, null);
                break;
            case "03":
                //playFreqM2M = function(frequency, duration (msec), 0-100)
                device.playFreqM2M(1047, 1000, 100);
                break;
            case "04":
                //startMotors = function (A/B/C/D/A+D/B+C, 0-100)
                device.startMotors("A", 100);
                break;
            case "05":
                //motorDegrees = function (A/B/C/D/A+D/B+C, 0-100, degrees, Break/<any other phrase>) 
                device.motorDegrees("A", 20, 90, "Break");
                break;
            case "06":
                //steeringControl = function (A/B/C/D/A+D/B+C, forward/reverse/left/right, 0-100, duration (sec), callback)
                device.steeringControl("A", "forward", 100, 1, null);
                break;
            case "07":
                //allMotorsOff = function (Break/<any other phrase>)
                device.allMotorsOff("Break");
                break;
            case "08":
                //readDistanceSensorPort = function (1/2/3/4, callback)
                device.readDistanceSensorPort(1, null);
                break;
            case "09":
                //readTouchSensorPort = function (1/2/3/4, callback)
                device.readTouchSensorPort(2, null);
                break;
            case "10":
                //readColorSensorPort = function (1/2/3/4, "color", callback) 
                device.readColorSensorPort(3, 'color', null);
                break;
            case "11":
                //readColorSensorPort = function (1/2/3/4, "ambient", callback) 
                device.readColorSensorPort(3, 'ambient', null);
                break;
            case "12":
                //readColorSensorPort = function (1/2/3/4, "reflected", callback) 
                device.readColorSensorPort(3, 'reflected', null);
                break;
            case "13":
                //readFromMotor = function (<spins>/"speed", A/B/C/D/A+D/B+C, callback) 
                device.readFromMotor("any", "A", null);
                break;
            case "14":
                //waitUntilDarkLine = function (1/2/3/4, callback) 
                device.waitUntilDarkLine(3, null);
                break;
            case "15":
                device.readBatteryLevel(null);
                break;
            default:
                console.log("no");
                break;
        }
        userInterface(device, list);
    })
};
// function sendCommand(miposaur, queue) {
    
// }
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
    var readMotorTypes = [""]

    // Device.prototype.startMotors = function (which, speed)
    // Device.prototype.motorDegrees = function (which, speed, degrees, howStop) 
    // Device.prototype.steeringControl = function (ports, what, speed, duration, callback)
    // Device.prototype.allMotorsOff = function (how)
    // function playTone(tone, duration, volume, callback) 
    // function playFreq(freq, duration, volume, callback)
    // function playFreqM2M(freq, duration, volume)
    // //READ FUNCTIONS
    // Device.prototype.whenButtonPressed = function (port)
    // Device.prototype.whenRemoteButtonPressed = function (IRButton, port)
    // Device.prototype.readDistanceSensorPort = function (port, callback)
    // Device.prototype.readRemoteButtonPort = function (port, callback)
    // Device.prototype.readTouchSensorPort = function (port, callback)
    // Device.prototype.readColorSensorPort = function (port, mode, callback) 
    // Device.prototype.readFromMotor = function (mmode, which, callback) 
    // Device.prototype.waitUntilDarkLine = function (port, callback) 