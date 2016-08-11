var Accessory 		= require('../').Accessory;
var Service 		= require('../').Service;
var Characteristic 	= require('../').Characteristic;
var uuid 			= require('../').uuid;

var Particle 		= require('particle-api-js');
var colors			= require("colors");
var loginInfo 		= require("../credentials.json");

var outletNum = "1";

// Login to Particle using stored credentials
var particle = new Particle();
var accessToken = "";

particle.login({
	username: loginInfo.username,
	password: loginInfo.password
}).then(
	function(data) {
		accessToken = data.body.access_token;
		console.log('Particle logged in with token: '.green, data.body.access_token);
	}, function(err) {
		console.log('Could not login to Particle: '.red, err);
	}
);

// Outlet Module device to expose to HomeKit
var OUTLET_CLASS = {
	powerOn: false,
	
	setPowerOn: function(value) { 
		console.log("Turning outlet " + outletNum + " %s", value ? "on" : "off");
		if (value) {
			var turnOnFnPtr = particle.callFunction({
				deviceId: loginInfo.outletModule_deviceID,
				name: "turnOn",
				argument: outletNum,
				auth: accessToken
			}).then(
				function(data) {
					console.log(green("Outlet " + outletNum + " successfully turned on: "), data);
				}, function(err) {
					console.log(red("Error turning on outlet " + outletNum + ":"), err);
				}
			);
		} else {
			var turnOffFnPtr = particle.callFunction({
				deviceId: loginInfo.outletModule_deviceID,
				name: "turnOff",
				argument: outletNum,
				auth: accessToken
			}).then(
				function(data) {
					console.log(green("Outlet " + outletNum + " successfully turned off: "), data);
				}, function(err) {
					console.log(red("Error turning off outlet " + outletNum + ":"), err);
				}
			);
		}
		OUTLET_CLASS.powerOn = value;
	},
	identify: function() {
		console.log("Outlet " + outletNum + " identified");
	}
}

// Create outlet accessory with unique identifier 
var outletUUID = uuid.generate('hap-nodejs:accessories:outlet');
var outlet = exports.accessory = new Accessory('Outlet ' + outletNum, outletUUID);

outlet.username = "1A:2B:3C:4D:5E:F" + outletNum;
outlet.pincode = "111-11-111";

// Add basic info
outlet
	.getService(Service.AccessoryInformation)
	.setCharacteristic(Characteristic.Manufacturer, "Connor Mason")
	.setCharacteristic(Characteristic.Model, "Rev-2")
	.setCharacteristic(Characteristic.SerialNumber, "CONNOR-OUTLET-00" + outletNum);

// Create indentify event
outlet.on('identify', function(paired, callback) {
	OUTLET_CLASS.identify();
	callback();
});

// Set function
outlet
	.addService(Service.Lightbulb, "Outlet")
	.getCharacteristic(Characteristic.On)
	.on('set', function(value, callback) {
		OUTLET_CLASS.setPowerOn(value);
		callback();
	});

// Get function
outlet
	.getService(Service.Lightbulb)
	.getCharacteristic(Characteristic.On)
	.on('get', function(callback) {
		var err = null;
		
		if (OUTLET_CLASS.powerOn) {
			console.log("Are we on? Yes.");
			callback(err, true);
		}
		else {
			console.log("Are we on? No.");
			callback(err, false);
		}
	});