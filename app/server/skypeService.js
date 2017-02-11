
"use strict";

var Skyweb = require('skyweb');
var simplecrypt = require('simplecrypt');

var conf = require('../configuration');
var log = require('../logger');
var PatternsService = require('./patternsService');
var Blink1Service = require('./blink1Service');

var sc = simplecrypt({salt:'boopdeeboop',password:'blink1control'});


var SkypeService = {
    skyweb: null,
    config: {},

    reloadConfig: function() {
        this.stop();
        this.start();
    },

    stop: function() {
        this.skyweb = null;
    },
    start: function() {
        var self = this;
        var config = conf.readSettings('eventServices:skypeService');
        if( !config ) { config = { enabled: false, rules:[] }; }
        self.config = config;
        if( !config.enabled ) {
            log.msg("SkypeService: disabled");
            return;
        }

        var allrules = conf.readSettings('eventRules') || [];
        self.rules = allrules.filter( function(r){return (r.type==='skype' || r.type==='skypestate');} );
        log.msg("SkypeService.start. rules=", self.rules);

        var rule = self.rules[0]; // FIXME:
        if( !rule || !rule.enabled ) {
            return;
        }
        var pass = '';
        try {
            pass = sc.decrypt( rule.password );
        } catch(err) {
            log.msg('SkypeService: bad password for rule',rule.name);
            return;
        }

        var skyweb = new Skyweb();
        self.skyweb = skyweb;

        self.success= false;
        // log.addEvent( {type:'info', source:'skype', id:rule.name, text:'connecting...'});
        log.addEvent( {type:'info', source:rule.type, id:rule.name, text:'connecting...'});

        skyweb.login(rule.username, pass).then((skypeAccount) => {
            self.success = true;
            log.msg('SkywebService is initialized now!');
            // log.msg('Here is some info about you:' + JSON.stringify(skypeAccount.selfInfo, null, 2));
            // log.addEvent( {type:'info', source:'skype', id:rule.name, text:'connected'});
            log.addEvent( {type:'info', source:rule.type, id:rule.name, text:'connected'});
            // console.log('Your contacts : ' + JSON.stringify(skyweb.contactsService.contacts, null, 2));
        }); // this following doesn't work
        //, () => {
        //  console.log("Skyweb error!!!!");
        //}
        //);

        // super hacky way to see if Skyweb succeeeded because it sucks at error handling
        setTimeout( function() {
            // check to see if we're okay or not
            if( !self.success ) {
                // log.addEvent( {type:'error', source:'skype', id:rule.name, text:'login error '});
                log.addEvent( {type:'error', source:rule.type, id:rule.name, text:'login error '});
            }
        }, 10000 );

        // FIXME: is this callback required?
        // No, it automatically accepts contact add requests
        // skyweb.authRequestCallback = (requests) => {
        //     requests.forEach((request) => {
        //         skyweb.acceptAuthRequest(request.sender);
        //         skyweb.sendMessage("8:" + request.sender, "I accepted you!");
        //     });
        // };
        skyweb.messagesCallback = (messages) => {
            messages.forEach((message)=> {
                if( rule.type === 'skype' && message.resourceType === 'NewMessage' ) {
                    if( !message.resource.counterpartymessageid ) { return }; // don't trigger an event with messages from myself
                    var convlink = message.resource.conversationLink;
                    var cname = convlink.substring(convlink.lastIndexOf('/8:')+3);
                    log.msg("SkypeService msg type:",message.resource.messagetype, "cname:",cname,
                            "dispname:",message.resource.imdisplayname, "content:",message.resource.content, message);
                    if( rule.triggerType === 'text' || rule.triggerType === 'any' ) {
                        if( message.resource.messagetype === 'Text' || message.resource.messagetype === 'RichText' ) {
                            log.msg("SkypeService: INCOMING TEXT FROM",cname);
                            log.addEvent( {type:'trigger', source:'skype', id:rule.name, text:'text: '+cname});
                            PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                        }
                    }
                    if( rule.triggerType === 'call' || rule.triggerType === 'any' ) {
                        if( message.resource.messagetype === 'Event/Call' &&
                            message.resource.content.includes('started') ) {
                            log.msg("SkypeService: INCOMING CALL FROM",cname);
                            log.addEvent( {type:'trigger', source:'skype', id:rule.name, text:'call: '+cname});
                            // log.addEvent( 'Skype call: '+cname);
                            PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                        }
                    }
                    if( rule.triggerType === 'any' ) {
                        if( message.resource.messagetype === 'RichText/Media_GenericFile' ||
                            message.resource.messagetype === 'RichText/Media_Video' ||
                            message.resource.messagetype === 'RichText/UriObject' ||
                            message.resource.messagetype === 'RichText/Contacts' ) {
                                log.msg("SkypeService: INCOMING MESSAGE FROM",cname);
                                log.addEvent( {type:'trigger', source:'skype', id:rule.name, text:'message: '+cname});
                                PatternsService.playPatternFrom( rule.name, rule.patternId, rule.blink1Id );
                        }
                    }
                }
                else if( rule.type === 'skypestate' && message.resourceType === 'UserPresence' ) {
                    log.msg("SkypeService: UserPresence message",message);
                    if( message.resource.selfLink.lastIndexOf('/1:') !== -1 ) {
                        var status = message.resource.status;
                        var color = "#000000";

					    if( status === 'Online' )      color = "#00ff00";
                        else if( status === 'Away' )   color = "#ffff00";
                        else if( status === 'Idle' )   color = "#ffff00";
                        else if( status === 'Busy' )   color = "#ff0000";
                        else if( status === 'Hidden' ) color = "#000000";

                        log.msg("SkypeService: Status is", status);
                        log.addEvent( {type:'trigger', source:'skypestate', id:rule.name, text:status});
                        Blink1Service.fadeToColor( 100, color, 0, rule.blink1id );
                    }
                }
                // also: message.resource.messagetype == 'Text'
                // also: message.resource.messagetype == 'Event/Call'
                // if (message.resource.from.indexOf(username) === -1 &&
                //     message.resource.messagetype !== 'Control/Typing' &&
                //     message.resource.messagetype !== 'Control/ClearTyping') {
                //     var conversationLink = message.resource.conversationLink;
                //     var conversationId = conversationLink.substring(conversationLink.lastIndexOf('/') + 1);
                //     skyweb.sendMessage(conversationId, message.resource.content + '. Cats will rule the World');
                // }
            });
        };

    }
};

module.exports = SkypeService;
