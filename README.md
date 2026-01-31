Iot Blinds was a group semester long project for a full stack Internet of things class.
The project as a whole consists of a full stack web application that can connect and affect motors affixed onto normal house blinds.
The user is able to control how open multiple sets of blinds are including setting an automatic mode which changes the openness of the blinds based on the ambient light in the room.

For the hardware on the blinds we used stepper motors programmed and connected to the internet via ESP32 microprocessors.

We use the online NoSQL database 'firebase'
Both the front and back end are programmed in Javascript. This is due to the fairly simple amount of coding on the main stack as the main focus was to integrate the hardware elements.
We used a serverless Jam architecture in which we do not host any servers. In order to connect we simply give our code to a third party website and they set up the server for us. This
works particularly well with firebase meaning for this project we did not host any programs on our own computers.
