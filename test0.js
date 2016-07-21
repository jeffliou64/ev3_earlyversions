var SerialPort = require('serialport');
var ev3dev = require('ev3dev-lang');
var port = new SerialPort('/dev/tty.serialEV3-SerialPort', baudRate = 56700, function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }

});

port.on('open', function () {
    port.write('main screen turn on', function (err) {
        if (err) {
            return console.log('Error on write: ', err.message);
        }
        port.drain(function (errr) {
            if (errr) {
                return console.log('error: ' + errr.message);
            }
            console.log('successful write');
        })
    });

    //var voltage = new Power_Supply();
    //console.log(voltage.measured_Voltage());
    SerialPort.list(function (err, ports) {
        ports.forEach(function (port) {
            console.log(port.comName);      //defined
            console.log(port.manufacturer); //undefined
            console.log(port.serialNumber); //undefined
            console.log(port.pnpId);        //undefined
            console.log(port.locationId);   //undefined
            console.log(port.vendorId);     //undefined
            console.log(port.productId);    //undefined
        });
    });
    
})