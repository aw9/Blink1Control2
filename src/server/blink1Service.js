/**
 *
 */

"use strict";

var _ = require('lodash');
var doUsbDetect = false;

var Blink1 = require('node-blink1');
var usbDetect = (doUsbDetect) ? require('usb-detection') : null;


var colorparse = require('parse-color');

// globals because we are a singleton
var listeners = {};
var blink1serials = []; // no, use hash? Blink1.devices();

var blink1 = null;
var blink1Vid = 0x27B8;
var blink1Pid = 0x01ED;

//var currentColor = colorparse('#ff00ff');
// array of colors, one per LED of blink1.
var currentColors = new Array( 16 );
var currentLedN = 0;

// FIXME: does lodash have a version of this?
var _clone = function(item) {
	return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Blink1Service = {

	startDeviceListener: function() {
		listeners = []; // erase previous listeners
		console.log("blink1serials:", typeof blink1serials);
		// initial population of any already-plugged in devices
		var serials = Blink1.devices();
		serials.map( function(s) {
			Blink1Service._addDevice(s);
		});

		console.log('Blink1ServerApi.startDeviceListener');
		if( !usbDetect ) { return; }

		// -- USB detection api
		// https://github.com/MadLittleMods/node-usb-detection
		usbDetect.on('add', function(device) {
			console.log('add', JSON.stringify(device), device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				//console.log('Blink1ServerApi.deviceListener, added', vid, pid, serialnumber);
				Blink1Service._addDevice( serialnumber );
			}
		});
		usbDetect.on('remove', function(device) {
			//console.log('remove', device);
			var vid = device.vendorId;
			var pid = device.productId;
			var serialnumber = device.serialNumber;
			if( vid === blink1Vid && pid === blink1Pid ) {
				Blink1Service._removeDevice( serialnumber );
			}
		});
	},

	closeAll: function() {
		console.log("Blink1ServerApi closeAll");
		if( usbDetect ) { usbDetect.stopMonitoring(); }
		// if( blink1 ) {
		// 	blink1.off();
		// 	// blink1.close();
		// }
		// blink1serials.map( Blink1Service._removeDevice );
		//this.removeAllListeners();
	},

	_addDevice: function(serialnumber) {
		console.log("Blink1ServerApi._addDevice: current serials:", JSON.stringify(blink1serials));
		if( blink1serials.indexOf(serialnumber) === -1 ) {
			console.log("new serial " + serialnumber + ", adding it");
			setTimeout(function() {
				Blink1Service._setupDevice();  // FIXME: remove
			}, 500);
			blink1serials.push(serialnumber);
		}
	},
	_removeDevice: function(serialnumber) {
		console.log("Blink1Service._removeDevice: current serials:", JSON.stringify(blink1serials));
		var i = blink1serials.indexOf(serialnumber);
		if( i > -1 ) {  // FIXME: this seems hacky
			blink1serials.splice(i, 1);
		}
		if( blink1 ) {
			console.log("closing blink1");
			blink1.close();
			blink1 = null;
			this.notifyChange();
		}
		console.log("Blink1Service._removeDevice: new current serials:", JSON.stringify(blink1serials));
	},
	_setupDevice: function() {
		console.log("opening blink1");
		if( !blink1 ) {
			blink1 = new Blink1();
			this.notifyChange();
		}
	},

	// internal function, accesses hardware
	_fadeToRGB: function( millis, r, g, b, n ) {
		if( blink1 ) {
			blink1.fadeToRGB( millis, r, g, b, n );
		}
		// else {
		// 	console.log("Blink1ServerApi._fadeToRGB: no blink1");
		// }
	},

	getAllSerials: function() {
		//blink1serials = Blink1.devices();
		return _clone(blink1serials);
	},

	isConnected: function() {
		return (blink1serials.length > 0);
	},

	serialNumber: function() {
		if( this.isConnected() ) {
			return blink1serials[0];
		}
		return '';
	},
	serialNumberForDisplay: function() {
		if( this.isConnected() ) {
			return blink1serials[0];
		}
		return '-';
	},
	iftttKey: function() {  // FIXME:
		var s = this.serialNumber();
		if( s ) {
			return s + s;
		} else {
			return "ABCD1234CAFE0000";
		}
	},

	getCurrentLedN: function() {
		return currentLedN;
	},
	getCurrentColor: function() { // FIXME
		console.log("Blink1Service.getCurrentColor: ", currentLedN);
		var ledn = (currentLedN>0) ? currentLedN-1 : currentLedN;
		return currentColors[ ledn ];
	},
	getCurrentColors: function() {
		return currentColors;
	},

	// main entry point for this service
	fadeToColor: function( millis, color, ledn) {
		ledn = ledn || 0;
		currentLedN = ledn;
		console.log("Blink1Service.fadeToColor:", ledn, color, typeof color, (color instanceof String) );
		//if( color instanceof String ) {  // NOOOO, this is not always true, literals vs objects
		if( typeof color === 'string' ) {
			color = colorparse( color ); // FIXME: must be better way
		}
		if( ledn === 0 ) {
			currentColors.fill( color.hex );
		} else {
		 	currentColors[ledn-1] = color.hex;
		}
		//console.log("Blink1ServerApi.fadeToColor: currentColor:", currentColor, "ms:", millis );

		this._fadeToRGB( millis, color.rgb[0], color.rgb[1], color.rgb[2], ledn);
		this.notifyChange();
	},

	addChangeListener: function(callback, callername) {
		listeners[callername] = callback;
		// console.log("Blink1Service: addChangelistener", listeners );
	},
	removeChangeListener: function(callername) {
		console.log("removeChangelistener: removing", callername);
		delete listeners[callername];
		console.log("Blink1Service: removeChangelistener", listeners );
	},
	removeAllListeners: function() {
		_.keys( listeners, function(callername) {
			this.removeChangelistener(callername);
		});
	},
	notifyChange: function() {
		_.forIn( listeners, function(callback) {
			callback( Blink1Service.getCurrentColor(), currentColors, currentLedN);
		});
	},


};


module.exports = Blink1Service;