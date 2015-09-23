"use strict";

var app = require('app');
var Tray = require('tray');
var Menu = require('menu');
var path = require('path');
var BrowserWindow = require('browser-window');
// var runtime = require('./src/core/runtime');
// var appMenu = require('./src/core/app-menu');

var configuration = require('./src/configuration');
var apiServer = require('./src/server/apiServer');
var Blink1Api = require('./src/server/blink1DeviceApi');
//var PatternsApi = require('./src/api/PatternsApi');
//Blink1Api.addColorChangeListener( PatternsApi.listenColorChange );

// electron-connect is for development
var client = require('electron-connect').client;
require('crash-reporter').start();

// Load external modules
// var mods = require('./core/modules');
// mods.load(runtime);

var mainWindow = null;
// var menu = null;

var trayIconPath = path.join(__dirname, './dist/images/blink1-icon0-bw16.png');
var appIcon = null;

apiServer.init(); // .start() to bootrap

// var configInit = function() {
// 	// if (!configuration.readSettings('shortcutKeys')) {
//     //     configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
//     // }
// 	if (!configuration.readSettings('shortcutKeys')) {
//         configuration.saveSettings('shortcutKeys', ['ctrl', 'shift']);
//     }
// };

var quit = function() {
	console.log("quitting...");
	// FIXME: put in blink1 & usb-detection closedown
	Blink1Api.closeAll();
	app.quit();

};

app.on('window-all-closed', function () {
	//if (process.platform !== 'darwin') {
		app.quit();
	//}
});

app.on('ready', function () {

	//configInit();


	Blink1Api.startDeviceListener();

	mainWindow = new BrowserWindow({
		width: 1300,
		height: 800
		// use-content-size: true
		// center: true
		// resizable: false
		// see https://github.com/atom/electron/blob/master/docs/api/browser-window.md
	});
	// mainWindow.setMenu(null);  // remove default menu
/*
	appIcon = new Tray(trayIconPath);
	var contextMenu = Menu.buildFromTemplate([
	{
		label: 'Item1',
		type: 'radio',
		icon: trayIconPath,
		click: function() {
			mainWindow.reload();
		}
		//accelerator: 'Command+Z'
	},
	{
	label: 'Item2',
		submenu: [
		{ label: 'submenu1' },
		{ label: 'submenu2' }]
	},
	{
		label: 'Item3',
		type: 'radio',
		checked: true
	},
	{
		label: 'Toggle DevTools',
		accelerator: 'Alt+Command+I',
		click: function() {
			mainWindow.show();
			mainWindow.toggleDevTools();
		}
	},
	{
		label: 'Quit',
		accelerator: 'Command+Q',
		//selector: 'terminate:',
		click: function() { quit(); }
	}
	]);
	appIcon.setToolTip('This is my application.');
	appIcon.setContextMenu(contextMenu);
	//mainWindow.setMenu( contextMenu );

	// ---
	var template = [{
    	label: "Application",
	    submenu: [
    	    { label: "About Blink1Control", selector: "orderFrontStandardAboutPanel:" },
        	{ type: "separator" },
	        { label: "Quit", accelerator: "Command+Q", click: function() { quit(); }}
    	]}, {
	    label: "Edit",
    		submenu: [
	        { label: "ZZUndo", accelerator: "Command+Z", selector: "undo:" },
    	    { label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
        	{ type: "separator" },
       		{ label: "Cut", accelerator: "Command+X", selector: "cut:" },
	        { label: "Copy", accelerator: "Command+C", selector: "copy:" },
    	    { label: "Paste", accelerator: "Command+V", selector: "paste:" },
        	{ label: "Select All", accelerator: "Command+A", selector: "selectAll:" }
	    ]}
	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	*/
	
	// runtime.emit(runtime.events.INIT_ROUTES, appMenu);
	// initialize runtime reference to main window
	// runtime.windowId = mainWindow.id;

	//mainWindow.loadUrl('file://' + __dirname + '/dist/index.html#/todtests');
	mainWindow.loadUrl('file://' + __dirname + '/dist/index.html');
	mainWindow.focus();

	mainWindow.openDevTools();

	// electron-connect to server process
    client.create(mainWindow);

	mainWindow.on('closed', function () {
		console.log("mainWindow is now closed");
		mainWindow = null;
	});

	mainWindow.onbeforeunload = function(e) {
		console.log('I do not want to be closed',e);
	};

	/*
	  // Dock Menu (Mac)
	  if (process.platform === 'darwin') {
		var dockMenu = Menu.buildFromTemplate([
		  { label: 'New Window', click: function() { console.log('New Window'); } },
		  { label: 'New Window with Settings', submenu: [
			{ label: 'Basic' },
			{ label: 'Pro'},
		  ]},
		  { label: 'New Command...'},
		]);
		app.dock.setMenu(dockMenu);
	  }
	  // Application Menu
	  runtime.emit(runtime.events.INIT_APP_MENU, appMenu);

	  var template = appMenu.template;
	  menu = Menu.buildFromTemplate(template);

	  if (process.platform === 'darwin') {
		Menu.setApplicationMenu(menu);
	  } else {
		mainWindow.setMenu(menu);
	  }*/
});
