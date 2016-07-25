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

v0.8.js: (readremotebuttonport (and IR responses)), fix MOTOR bugs & make them more independent.

         1) fixed motor differences (each motor can now run and stop independently);
         
         2) write motor degrees somewhat working (the angle that is spun is often slightly off from what was sent)
         
                note: higher speed makes it even more unreliable (maybe have Tickle set a low speed (10%)
                
         2) make sure all IR responses work properly
         
         3) < get remote button port reading complete >
         
         4) < test all motors, test all reading types (color, touch, IR, motor, UI) , test remote buttons, test brick buttons >






v1.0.js: everything functional at baselevel. next step(s): simplify code, mesh blocks together, increase performance efficiency