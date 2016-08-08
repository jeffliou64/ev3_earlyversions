test0.js: successful connection and writing to the EV3 brick. Also lists serial ports

v0.1.js: successful testing of sending command arrays to the EV3 brick with serialport functions.

v0.2.js: connection with possibility of multiple devices connected. Turned Device into a class-like instance

v0.3.js: Added readBatteryLevel(), sendCommand(), executeQueryQueue(), addToQueryQueue(), and other supporting functions.

v0.4.js: Motor functions added and working. Can send a "start moving at ___ speed" block

v0.5.js: Timed motor functions working (with timing hiccup: can't add to queue properly, all commands acting at same time unless a setTimeout() is used). 
         Tone/Freq/FreqM2M functions fully functional.

v0.6.js: Reading from Color sensor (color, reflected intensity) implemented and functional. readDistanceSensorPort functional.
         Next step: check readfrommotor and readfromtouchsensor

v0.7.js: Read from Motors and read from touch sensor functional. One existing issue is that motors will run simutaneously (and durations add up),
         and that the queue currently adds up a lot of performance time (listing a bunch of commands will stop motors from stopping until all commands complete)
         Also, there seems to be a slight difference between the motor value given and the motor value read.

v0.8.js: MADE THE FOLLOWING CHANGES:

    1) fixed motor differences (Motor functions fixed, can now individually be monitored (start and stop independently). );
    
    2) write-motor-degrees somewhat working (the angle that is spun is often slightly off from what was sent)
    
        note: higher speed makes it even more unreliable (maybe have Tickle set a low speed (10%))
        
    3) IR Sensor can now receive and parse which button is being pressed on the IR remote
    
    4) ReadButtonPort works, currently just runs readTouchSensor code. Not sure what to do about it.
    
    5) TESTED: 
            
        Motors: start_moving, timed, stop_all, stop_one, read_from_motor
        
        Sensors: read_IR_Distance, read_touch_sensor, read_color_sensor(color, intensity), read_IR_remote_sensor


V1.0.js: everything functional at baselevel. Added: Volume control, separate testing function, getMotorName, added remaining frequencies, clearSensors function

V1.1.js: Added: waitTillDarkLine

    Next Steps: figure out built-in sounds, IR Beacon Mode..?, RGB Mode..?