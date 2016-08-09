var Accessory 		= require('../').Accessory;
var Service 		= require('../').Service;
var Characteristic 	= require('../').Characteristic;
var uuid 			= require('../').uuid;
var Particle 		= require('particle-api-js');
var loginInfo 		= require("credentials.json");

var exec = require('child_process').exec;

// Set outlet module Particle Photon device ID here
var outletModuleParticleDeviceID = loginInfo.outletModule_deviceID;

// Login to Particle using stored credentials
var particle = new Particle();
particle.login({
	username: loginInfo.username,
	password: loginInfo.password
}).then(
	function(data) {
		console.log('API call completed on promise resolve: ', data.body.access_token);
	}, function(err) {
		console.log('API call completed on promise fail: ', err);
	}
)

// var fnPtr = particle.callFunction({
// 	deviceId: outletModuleParticleDeviceID,
// 	name: "turnOn",
// 	argument: "4",
// 	auth: 
// })

var cmdOn = "particle call " + outletModuleParticleDeviceID + " turnOn 4";
var cmdOff = "particle call " + outletModuleParticleDeviceID + " turnOff 4";

// here's a fake hardware device that we'll expose to HomeKit
var FAKE_LIGHT = {
	powerOn: false,
	brightness: 100, // percentage
	
	setPowerOn: function(value) { 
		console.log("Turning the light %s!", value ? "on" : "off");
		if (value) {
			exec(cmdOn, function(error, stdout, stderr) {});
		} else {
			exec(cmdOff, function(error, stdout, stderr) {});
		}
		FAKE_LIGHT.powerOn = value;
	},
	setBrightness: function(brightness) {
		console.log("Setting light brightness to %s", brightness);
		FAKE_LIGHT.brightness = brightness;
	},
	identify: function() {
		console.log("Identify the light!");
	}
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:light');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory('Light', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "1A:2B:3C:4D:5E:FF";
light.pincode = "031-45-154";

// Set basic properties
light
	.getService(Service.AccessoryInformation)
	.setCharacteristic(Characteristic.Manufacturer, "Connor Mason")
	.setCharacteristic(Characteristic.Model, "Rev-2")
	.setCharacteristic(Characteristic.SerialNumber, "CONNOROUTLETMODULE1");

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
	FAKE_LIGHT.identify();
	callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
	.addService(Service.Lightbulb, "Fake Light") // services exposed to the user should have "names" like "Fake Light" for us
	.getCharacteristic(Characteristic.On)
	.on('set', function(value, callback) {
		FAKE_LIGHT.setPowerOn(value);
		callback(); // Our fake Light is synchronous - this value has been successfully set
	});

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
	.getService(Service.Lightbulb)
	.getCharacteristic(Characteristic.On)
	.on('get', function(callback) {
		
		// this event is emitted when you ask Siri directly whether your light is on or not. you might query
		// the light hardware itself to find this out, then call the callback. But if you take longer than a
		// few seconds to respond, Siri will give up.
		
		var err = null; // in case there were any problems
		
		if (FAKE_LIGHT.powerOn) {
			console.log("Are we on? Yes.");
			callback(err, true);
		}
		else {
			console.log("Are we on? No.");
			callback(err, false);
		}
	});
