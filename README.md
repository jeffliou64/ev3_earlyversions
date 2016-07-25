test0.js: successful connection and writing to the EV3 brick. Also lists serial ports

v0.1.js: successful testing of sending command arrays to the EV3 brick with serialport functions.

v0.2.js: connection with possibility of multiple devices connected. Turned Device into a class-like instance

v0.3.js: Added readBatteryLevel(), sendCommand(), executeQueryQueue(), addToQueryQueue(), and other supporting functions.

v0.4.js: Motor functions added and working. Can send a "start moving at ___ speed" block

v0.5.js: Timed motor functions working (with timing hiccup: can't add to queue properly, all commands acting at same time unless a setTimeout() is used). 
         Tone/Freq/FreqM2M functions fully functional.

v0.6.js: Reading from Color sensor (color, reflected intensity) implemented and functional. readDistanceSensorPort functional.
         Next step: check readfrommotor and readfromtouchsensor

v0.7.js: (readfrommotor & readfromtouchsensor (not sure if this will work without watchdog))

v0.8.js: (readremotebuttonport (and IR responses))


v1.0.js: everything functional at baselevel. next step: test multiple commands at once (queryqueue), simplify code, mesh blocks together