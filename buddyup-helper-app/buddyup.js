/*jslint indent: 2 */
/*global window */
/*global document */


/*

To get BuddyUp functionality installed, you need to copy the "buddyup" directory
into your source tree's gaia/apps/system tree, peer to the system app's index.html file.

Then, edit the index.html file and add

<!-- Buddy Up -->"
<script defer="" src="buddyup/js/buddyup.js"></script>
<link rel="stylesheet" type=\"text/css" href="buddyup/style/buddyup.css">

into the <head> block and reflash gaia onto your device

after flashing, in the notifications tray, you will see a small tab at 
the top called BuddyUp.  Tapping this opens and closes the BuddyUp control
panel


!!!! TBD!

System now just needs to cap screens, connect to socket, and replay incoming events

we no longer need to act as controller from system!



*/


var BuddyUp = {

  debug: true,

  socketServer: "",

  canTriggerEvents: true,
  lastEventTime: 0,
  lastMoveEvent: 0,
  lastTarget: 0,
  isController: false,
  startEventTarget: false,
  movedBeyondClick: false,

  init: function () {

    this.log("BUDDY UP HELPER INIT, binding and loading markup...");
    
    
    document.addEventListener("DOMContentLoaded", function() {
      
      BuddyUp.markupLoaded();
      
    }, false);
    
    

    

  },

  markupLoaded: function () {

    this.log("LOADED ALL MARKUP!");
    
    
    // connect and disconnect listeners: 
    document.getElementById("buddyup-connect").addEventListener("click", function() {
      
      console.log("click on connect!");
      
      BuddyUp.isController = true;
      
      
      // hard coding all these values for now, should push to config and/or UI
      BuddyUp.socketServer = "showme.bunnyandboar.com:80";
      BuddyUp.socketProtocol = "fxos-showme-protocol";
      BuddyUp.clientType = "controller";
      BuddyUp.groupID = "g1";

      BuddyUp.log("TRYING TO CONNECT TO SOCKET SERVER: ");
      BuddyUp.log("server: " + BuddyUp.socketServer + " clientType: " + BuddyUp.clientType + " group: " + BuddyUp.groupID);

      
      try {
        
        SocketTransport.openNewSocketCx(
          BuddyUp.socketServer, BuddyUp.socketProtocol, BuddyUp.clientType, BuddyUp.groupID
        );
      }
      catch (er) {
        console.log("socket connection fail!");
        console.log(er.message);
      }
      
      
    }, false);
    
    document.getElementById("buddyup-disconnect").addEventListener("click", function() {
      
      console.log("click on disconnect!");
      
      if (SocketTransport.socket) {

        SocketTransport.socket.close();
        SocketTransport.isOpen = false;
        //BuddyUp.stopScreenCap();

      }
      else {
        console.log("NO SOCKET TO CLOSE!"); 
      }
      
      
      document.getElementById("buddyup-connection-status").innerHTML = "not connected";
      
      
      
      
      
    }, false);
    
    
    document.getElementById("buddyup-block-taps").addEventListener("click", function() {
      
      document.getElementById("buddyup-block-taps").classList.toggle("blocked");
      
      if (document.getElementById("buddyup-block-taps").classList.contains("blocked")) {
      
        console.log("TBD! handle remote block!");
        SocketTransport.sendHardwareEvent('touches-disabled');
        
      }
      else {
        
        SocketTransport.sendHardwareEvent('touches-enabled');
      
      }
      
      
    }, false);
    
    document.getElementById("buddyup-home-btn").addEventListener("click", function() {
      
      console.log("SENDING FAKE HOME BUTTON PRESS!");
      
      SocketTransport.sendHardwareEvent("home-button-press");
      SocketTransport.sendHardwareEvent("home-button-release");
      
    }, false);
    
    document.getElementById("chat-send-btn").addEventListener("click", function() {
      
      var chatText = document.getElementById("new-chat-text").value;
      document.getElementById("new-chat-text").value = "";
      
      console.log("SENDING CHAT: " + chatText);
      
      document.getElementById("chat-log").innerHTML = '<div class="chat-me">' + chatText + '</div>' + document.getElementById("chat-log").innerHTML;
      
      var timestamp = new Date().getTime();
      var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "chat", "status": "ok", "chatText": "' + chatText + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

      try {
        
        console.log("sending: " + msg);
      
        SocketTransport.socket.send(msg);
      
      }
      catch (er) {
        console.log("couldn't send chat text..."); 
      }
    }, false);
    
    
    
    
  

    // listeners and alternates to bind to.... 

    var screenDiv = document.getElementById("remote-screen-cap");
    
    
    screenDiv.addEventListener('touchstart', function (inEvent) {

      //inEvent.stopPropagation();
      //inEvent.preventDefault();

      if (BuddyUp.isController) {
        
        BuddyUp.log("start " + inEvent.touches[0].pageX + " " + inEvent.touches[0].pageY);

        var target = document.elementFromPoint(inEvent.touches[0].pageX, inEvent.touches[0].pageY);

        
        BuddyUp.log(" target id: " + target);

        
        BuddyUp.lastTarget = target;
        BuddyUp.startEventTarget = target;

        
        BuddyUp.lastX = inEvent.touches[0].pageX;
        BuddyUp.lastY = inEvent.touches[0].pageY;
        BuddyUp.origX = inEvent.touches[0].pageX;
        BuddyUp.origY = inEvent.touches[0].pageY;


        SocketTransport.sendEvent(inEvent, BuddyUp.lastTarget, BuddyUp.lastTarget.nodeName);
        

      }

    }, false);
    

    screenDiv.addEventListener('touchend', function (inEvent) {

      //inEvent.stopPropagation();
      //inEvent.preventDefault();      

      if (BuddyUp.isController) {
        
        var evt = BuddyUp.unSynthetizeEvent(inEvent);
        //var evtString = JSON.stringify(evt);
        var endX = evt[2][0];
        var endY = evt[3][0];
        
        var target = document.elementFromPoint(endX, endY);
        
        
        

        console.log("touched from x: " + BuddyUp.origX + " y: " + BuddyUp.origY);
        console.log("touched  to  x: " + endX + " y: " + endY);

        //if (target.nodeName.toLowerCase() == "iframe") {
          SocketTransport.sendEvent(inEvent, BuddyUp.lastTarget, BuddyUp.lastTarget.nodeName);
        //}
        
      } 


    }, false);
    
    
    screenDiv.addEventListener('touchcancel', function (inEvent) {
 
      console.log("!!!! TBD IN BuddyUp! DO WE WANT TO HANDLE TOUCH CANCEL?");

    }, false);

       
    
    
    // Sneak in and listen for hardware buttons....
    window.addEventListener('mozChromeEvent', function(inEvent) {
      
      var eventType = inEvent.detail.type;
      
      //document.querySelector("#buddyup-socket-status").innerHTML = "mozChromeEvent type? <span>" + eventType + "</span>";
       
      
      if (
        eventType == "home-button-press" || 
        eventType == "home-button-release" ||
        eventType == "volume-up-button-press" ||
        eventType == "volume-up-button-release" ||
        eventType == "volume-down-button-press" ||
        eventType == "volume-down-button-release"
        
      ) {
      
        SocketTransport.sendHardwareEvent(eventType);
      
      }
      
    }, false);

  },
  
  
  handleBuddyUp: function (inMessage) {

    BuddyUp.log("HANDLE SHOW ME MESSAGE, inMessage:" + inMessage);

  },
  

  log: function (inLog) {

    if (this.debug && console) {

      // create some hope of finding this in ddms ;-)
      console.log("*** SHOW ME LOG -- " + inLog);
      
      
      

    }
    if (document.querySelector("#buddyup-debug") && inLog) {
      document.querySelector("#buddyup-debug").innerHTML = inLog;
    }

  },
  
  findMidpoint: function (inX1, inY1, inX2, inY2) {
      
    var midPointX = Math.round ( (inX1+inX2)/2 );
    var midPointY = Math.round ( (inY1+inY2)/2 );
    
    return { x: midPointX, y: midPointY };
  
  },

  

  fireTouchEvent: function (inEvent, inTarget, inName) {
    
    var touchEvent = document.createEvent('touchevent');
    
    var touchPoint = document.createTouch(
      window, 
      inTarget, 
      0,
      inEvent.pageX, inEvent.pageY,
      inEvent.pageX, inEvent.pageY,
      inEvent.pageX, inEvent.pageY,
      1, 1, 0, 0
    );
    
    var touchList = document.createTouchList(touchPoint);
    
    touchEvent.initTouchEvent(
      inName, true, true, window, 0, false, false, false, false,touchList, touchList, touchList
    );

    inTarget.dispatchEvent(touchEvent);
    
    if (inName == "touchstart") BuddyUp.fireMouseEvent("mousedown", inTarget, inEvent.pageX, inEvent.pageY);
    else if (inName == "touchmove") BuddyUp.fireMouseEvent("mousemove", inTarget, inEvent.pageX, inEvent.pageY);
    else if (inName == "touchend") BuddyUp.fireMouseEvent("mouseup", inTarget, inEvent.pageX, inEvent.pageY);

  },

  
  fireMouseEvent: function sm_fireMouseEvent (inType, inTarget, x, y) {

      var evt = document.createEvent('MouseEvent');
      
      evt.initMouseEvent(
        inType, true, true, window, 0, x, y, x, y, false, false, false, false, 0, null
      );
      
      inTarget.dispatchEvent(evt);

  },

  
  relayTouchEvent: function sm_relayTouchEvent (inFrame, inEvent) {

    
    // ok so, it looks to me like the ref devices need "real" pixels
    // to pass to sendTouchEvent().  right now we're scaled to X, so
    // multiply the event location by X
    
    // device thinks it is  WIDTH: 320 HEIGHT: 569
    // actual resolution is: 
    
    // window.devicePixelRatio
    
    // actual res is 1.5x so...  HATE THIS! 
    
    inEvent[2][0] *= window.devicePixelRatio;
    inEvent[3][0] *= window.devicePixelRatio;
    
    console.log("!!!!!!!!! x: " + inEvent[2]);
    console.log("!!!!!!!!! y: " + inEvent[3]);
    
    //inFrame.sendTouchEvent.apply(null, inEvent);

    BuddyUp.log(" +++ sending new touch event +++ ");
    BuddyUp.log(" +++ name: " + inEvent[0] + " X: " + inEvent[2][0] + " and Y: " + inEvent[3][0] + " +++ ");
    BuddyUp.log("WINDOW WIDTH: " + window.innerWidth + " HEIGHT: " + window.innerHeight);
    
    try {
      
      //inFrame.sendTouchEvent(inEvent);
      inFrame.sendTouchEvent.apply(null, inEvent);
    }
    catch(er) {
      console.log(er.message); 
    }
  },


  // borrowed from the new app switcher in system!
  unSynthetizeEvent: function sm_unSynthetizeEvent(e) {
    var type = e.type;
    var relevantTouches = (type == 'touchmove') ? e.touches : e.changedTouches;
    var identifiers = [];
    var xs = [];
    var ys = [];
    var rxs = [];
    var rys = [];
    var rs = [];
    var fs = [];

    for (var i = 0; i < relevantTouches.length; i++) {
      var t = relevantTouches[i];

      identifiers.push(t.identifier);
      xs.push(t.pageX);
      ys.push(t.pageY);
      rxs.push(t.radiusX);
      rys.push(t.radiusY);
      rs.push(t.rotationAngle);
      fs.push(t.force);
    }

    return [type, identifiers, xs, ys, rxs, rys, rs, fs, xs.length];
  },

  
  publishEvent: function (inType, inElement) {
    var evt = document.createEvent('CustomEvent');
    evt.initCustomEvent('softwareButtonEvent', true, false, {
      type: inType
    });
    
    //document.querySelector("#buddyup-socket-status").innerHTML = "FIRE " + inType;
    
    inElement.dispatchEvent(evt);
  }
  

};



var SocketTransport = {

  socket: false,
  isOpen: false,
  socketServer: "",
  protocol: "fxos-showme-protocol",
  clientID: "",
  clientType: "client", // can be either "client" or "controller"
  groupID: "",
  callCount: 0,

  openNewSocketCx: function (inSocketServer, inProtocol, inClientType, inGroupID) {

    if (!inSocketServer) {
      return; // TBD: throw / catch some errors here?
    }

    this.socketServer = "ws://" + inSocketServer;

    if (inProtocol) {
      this.protocol = inProtocol;
    }

    if (inClientType) {
      this.clientType = inClientType;
    }

    if (inGroupID) {
      this.groupID = inGroupID;
    }
    
    try {

      if (SocketTransport.socket) {

        SocketTransport.socket.close();

      }

      SocketTransport.socket = new WebSocket(SocketTransport.socketServer, SocketTransport.protocol);

    } catch (er) {

      BuddyUp.log("can't create socket, looks like we are offline or blocked? :-/");
      BuddyUp.log(er);
      BuddyUp.log("-----------------------------------------------------------------");
      SocketTransport.socket = false;

    }
    
    
    console.log("-----------------------------------------------------------------");
    console.log("-----------------------------------------------------------------");
    console.log(navigator.userAgent);
    console.log("-----------------------------------------------------------------");
    console.log("-----------------------------------------------------------------");


    if (SocketTransport.socket) {
      
      // clean up from recovery, as needed: 
      if (SocketTransport.recoveryInterval) {
        clearInterval(SocketTransport.recoveryInterval); 
      }
      SocketTransport.recoveryInterval = 0;
      SocketTransport.recoveryTries = 0;
      
      

      document.querySelector('#buddyup-connection-status').innerHTML = "Connecting... ";

      SocketTransport.clientID = SocketTransport.generateID();
      
      
      // set a timeout for the connection?
      SocketTransport.isOpen = false;
      setTimeout(function() {
        
        if (! SocketTransport.isOpen) {
          
          
          document.querySelector('#buddyup-connection-status').innerHTML = "Can't connect. Are you on the network?";
          
        
        }
        
        
      }, 3000);
      

      SocketTransport.socket.addEventListener("open", function (event) {

        SocketTransport.isOpen = true;
        
        document.querySelector('#buddyup-connection-status').innerHTML = "Connected! ";

        BuddyUp.log("SOCKET Connected!");

        // say hi to the server!
        var msg = '{ "clientID": "' + SocketTransport.clientID + '", "clientType":"' + SocketTransport.clientType + '", "groupID": "' + SocketTransport.groupID + '", "type": "hello", "status": "ok", "message": "hello", "x": 0, "y": 0 }';
        SocketTransport.socket.send(msg);
        
        if (SocketTransport.clientType == "client") {
         
          console.log("i'm a client, starting screen cap...");
          
          //BuddyUp.startScreenCap();
          
        }
        
      
      });


      
      //! Handle messages received from the server
      SocketTransport.socket.addEventListener("message", function (event) {
        //message.textContent = "Server Says: " + event.data;
        
        var returnMessage = JSON.parse(event.data);
        SocketTransport.processMessage(returnMessage);

      });

      
      SocketTransport.socket.addEventListener("error", function (inError) {

        BuddyUp.log("there was a socket error: " + inError.code);
        
        SocketTransport.isOpen = false;
        
        //BuddyUp.stopScreenCap();
        
        document.querySelector('#buddyup-connection-status').innerHTML = "error. not connected";
        
        if (SocketTransport.clientType != "controller") {
          // send a touchend to reset us if we're clients
          console.log("~~~Sending ERROR STATE TOUCH END");
          
          if (BuddyUp.startEvent) {
            
            BuddyUp.startEvent[0] = "touchend";
            BuddyUp.relayTouchEvent(BuddyUp.origTarget, BuddyUp.startEvent);
          
          }
        }
        
        
        //document.querySelector("#buddyup-start").value = "Connect";
        
        //SocketTransport.recoverIfYouCan();
        

      });

      
      SocketTransport.socket.addEventListener("close", function (event) {
        
        console.log ("SOCKET CLOSING!");
        console.log(event.reason);
        
        SocketTransport.socket = false;
        SocketTransport.isOpen = false;
        document.querySelector('#buddyup-connection-status').innerHTML = "connection closed";
        
        //document.querySelector("#buddyup-start").value = "Connect";
        
        //BuddyUp.stopScreenCap();

      });

    } // end if SocketTransport.socket sanity check
    
    else {
      document.querySelector('#buddyup-connection-status').innerHTML = "not connected";
      //document.querySelector("#buddyup-start").value = "Connect";
    }
    
    this.callCount = 0;

  },  
  

  // a quicky function to create this client a UUID
  generateID: function () {

    // always start with a letter (for DOM friendlyness)
    var idstr = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
    do {
      // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
      var ascicode = Math.floor((Math.random() * 42) + 48);
      if (ascicode < 58 || ascicode > 64) {
        // exclude all chars between : (58) and @ (64)
        idstr += String.fromCharCode(ascicode);
      }
    } while (idstr.length < 5);

    return (idstr + new Date().getTime());

  },

  
  // we have received a socket message, let's have a look at it...
  // inMessage.type is the "opcode" here, such as it is
  processMessage: function (inMessage) {

    //BuddyUp.log("!!!!!!!!!!!!!!!! MESSAGE IN!");
    //BuddyUp.log("!!!!!!!!!!!!!!!! " + inMessage.type); 
    
    this.callCount ++;
  
    
    //document.querySelector('#buddyup-socket-status span').innerHTML = 
    //  this.callCount + " " + SocketTransport.socket.bufferedAmount;
    
    
    // handle hardware inputs first...
    if ( inMessage.uiEvent == "hardwareButton" && inMessage.clientID != SocketTransport.clientID ) {
    
      BuddyUp.log("incoming hardware button event: " + inMessage.hardwareEvent);
    
      if (inMessage.hardwareEvent == 'home-button-press') {
        BuddyUp.publishEvent('home-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'home-button-release') {
        BuddyUp.publishEvent('home-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-up-button-press') {
        BuddyUp.publishEvent('volume-up-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-up-button-release') {
        BuddyUp.publishEvent('volume-up-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-down-button-press') {
        BuddyUp.publishEvent('volume-down-button-press', window);
      }
      
      else if (inMessage.hardwareEvent == 'volume-down-button-release') {
        BuddyUp.publishEvent('volume-down-button-release', window);
      }
      
      else if (inMessage.hardwareEvent == 'touches-enabled') {
        console.log("~~~~~ enabling TOUCHES on all clients!");
        document.getElementById("buddyup-event-catcher").classList.remove("touches-disabled");
      }
      
      else if (inMessage.hardwareEvent == 'touches-disabled') {
        console.log("~~~~~ DISABLING TOUCHES on all clients!");
        document.getElementById("buddyup-event-catcher").classList.add("touches-disabled");      
      }
      
      
    } // end hardware button event
    
    else if ( inMessage.uiEvent == "chat" && inMessage.clientID != SocketTransport.clientID ) {
     
      console.log("!!!!! WOW! incoming chat!!");
      
      document.getElementById("chat-log").innerHTML = '<div class="chat-them">' + inMessage.chatText + '</div>' + document.getElementById("chat-log").innerHTML;
      
      
      
    }
    
    // handle incoming screen data
    else if ( inMessage.uiEvent == "screencap" && inMessage.clientID != SocketTransport.clientID ) {
     
      console.log("!!!!! WOW! incoming screen cap!");
      
      var image = document.querySelector("#remote-screen-image");
      image.src = inMessage.imageUrl;  
      
      
      
    }
    
    
    else if (inMessage.type == "uiEvent" && inMessage.clientID != SocketTransport.clientID) {

      
      //BuddyUp.log("INCOMING EVENT RECEIVED!");
      //BuddyUp.log("message for group: " + inMessage.groupID);
      //BuddyUp.log(inMessage.uiEvent);

      
      var cleanEvent = inMessage.uiEvent.replace(/'/g, '"');

      var inEvent = JSON.parse(cleanEvent);

      var incomingX = inEvent[2][0];
      var incomingY = inEvent[3][0];
      
      
      var eventCatcher = document.getElementById("buddyup-event-catcher");
      // hide event catcher as needed to calculate target
      if (eventCatcher.classList.contains("touches-disabled")) {
        eventCatcher.classList.remove("touches-disabled");
        var target = document.elementFromPoint(incomingX, incomingY);
        eventCatcher.classList.add("touches-disabled");
      }
      else { 
        var target = document.elementFromPoint(incomingX, incomingY);
      }
            

      if (inEvent[0] == 'touchstart') {

        //console.log("~~~~~~ TOUCH START: " + cleanEvent);
        
        BuddyUp.origX = incomingX;
        BuddyUp.origY = incomingY;
        BuddyUp.startEvent = inEvent;
        BuddyUp.origTarget = target;
        BuddyUp.eventStartTime = inMessage.timestamp;
        
        //if (target.nodeName.toLowerCase() == "iframe") {
          
          //document.querySelector("#buddyup-touch-indicator").classList.add("visible");
          //var translateString = incomingX + "px, " + incomingY + "px, 0";
          //document.querySelector("#buddyup-touch-indicator").style.transform = 
          //    "translate3d(" + translateString + ")";
        
        //}

      } 
      
      else if (inEvent[0] == 'touchend') {

       // var translateString = incomingX + "px, " + incomingY + "px, 0";
       // document.querySelector("#buddyup-touch-indicator").style.transform = 
       //   "translate3d(" + translateString + ")";
        
        
        // the relayed event has ended, fire the events on the target:
        
        var timeDelta = inMessage.timestamp - BuddyUp.eventStartTime;
          
        //BuddyUp.log("calling relay with a time delta of: " + timeDelta);
          
        // we are only relaying events to iframes for now, i.e. not "system" events 
        if (BuddyUp.origTarget.nodeName.toLowerCase() == "iframe") {

          
          console.log("~~~~fire touch start with x: " + BuddyUp.startEvent[2][0] + " and y " + BuddyUp.startEvent[3][0]);
          
          BuddyUp.relayTouchEvent(BuddyUp.origTarget, BuddyUp.startEvent);
          
          // do we want to fire fake mouse events as well?
          var x = BuddyUp.startEvent[2][0];
          var y = BuddyUp.startEvent[3][0];


          BuddyUp.origTarget.sendMouseEvent('mousedown', x, y, 0, 1, null);
        } 
        else { // try to relay the touch to the system level
          
          
          BuddyUp.fireTouchEvent(BuddyUp.startEvent, BuddyUp.origTarget, "touchstart");
          
        }
          
          
        var deltaX = incomingX - BuddyUp.origX;
        var deltaY = incomingY - BuddyUp.origY;
        
        
        // we want the minimum # of steps here for better performance
        // particularly on older hardware, the event firing takes longer than the interval
        var touchEmulationSteps = 12;
        var vectorIncrement = { x: deltaX / touchEmulationSteps, y: deltaY / touchEmulationSteps };
          
        // on high-res screens, the vector increment in real pixels will be very small
        // so calculate x and y move thresholds based on screen width...
        
        var baseWidth = window.innerWidth;
        var moveThreshold = baseWidth / 12; // that is, we need a move of at least 1/12 the screen width

        
        console.log("~~~~move threshold calculated at " + moveThreshold);
        
        
        // EMULATE MOVES if we have enough delta between touch start and touch end
        //!!!! testing
        if ( Math.abs(deltaX) > moveThreshold || Math.abs(deltaY) > moveThreshold ) {
            
          var incrementTimeBasedOnTimeDelta = timeDelta / touchEmulationSteps;
            
          console.log("~~~~~~ setting increment time to: " + incrementTimeBasedOnTimeDelta);
          
          //! TBD: can we switch this to animation frames?

          // now fire [touchEmulationSteps] move events based on the vector:
          var vectorIndex = 1;
          var vectorInterval = setInterval(function() {

              
            if (vectorIndex <= touchEmulationSteps) {
              var x = BuddyUp.origX + (vectorIncrement.x * vectorIndex);
              var y = BuddyUp.origY + (vectorIncrement.y * vectorIndex);

              BuddyUp.startEvent[0] = "touchmove";
              BuddyUp.startEvent[2][0] = x;
              BuddyUp.startEvent[3][0] = y;
                              
              //console.log("~~~Sending TOUCH MOVE to " + x + " and " + y);
              //BuddyUp.relayTouchEvent(BuddyUp.origTarget, BuddyUp.startEvent);
              
              var currentTarget = document.elementFromPoint(x, y);
                
              if (currentTarget.nodeName.toLowerCase() == "iframe") {
                BuddyUp.relayTouchEvent(currentTarget, BuddyUp.startEvent);

                currentTarget.sendMouseEvent('mousemove', x, y, 0, 1, null);
              }
              else {
                BuddyUp.fireTouchEvent(BuddyUp.startEvent, currentTarget, "touchmove"); 
              }


            }
            else {

              console.log("~~~clearing interval!");
              clearInterval(vectorInterval);

              if (target.nodeName.toLowerCase() == "iframe") {
                
                // relay touchend
                console.log("Sending TOUCH END");
                
                BuddyUp.relayTouchEvent(target, inEvent);
                
                target.sendMouseEvent('mouseup', incomingX, incomingY, 0, 1, null);
              
              } 
              else {
                BuddyUp.fireTouchEvent(inEvent, target, "touchend");   
              }
                
              //document.querySelector("#buddyup-touch-indicator").classList.remove("visible");

            }

            vectorIndex ++;

            }, incrementTimeBasedOnTimeDelta);
          
          }
          
          // otherwise, just fire touch end after 80ms
          else {
            
            
            // some fxos elements seem to only properly recognize selection of elements
            // when MOUSEDOWN and MOUSEUP are fired on them. WTF?
            //if (BuddyUp.origTarget.nodeName.toLowerCase() == "iframe") {
              //BuddyUp.origTarget.sendMouseEvent('mousedown', incomingX, incomingY, 0, 1, null);
            //}
            setTimeout(function() {
              
              console.log("~~~~~~ Sending TOUCH END with NO MOVE: x: " + incomingX + " and " + incomingY);
                            
              //BuddyUp.relayTouchEvent(target, inEvent);
              if (BuddyUp.origTarget.nodeName.toLowerCase() == "iframe") {
                
                //BuddyUp.startEvent[0] = "touchend";
                
                BuddyUp.relayTouchEvent(target, inEvent);
                
                target.sendMouseEvent('mouseup', incomingX, incomingY, 0, 1, null);
                //target.sendMouseEvent('click', incomingX, incomingY, 0, 1, null);
                           
                
              }
              else {
                BuddyUp.fireTouchEvent(inEvent, target, "touchend");   
              }
              
            

              //document.querySelector("#buddyup-touch-indicator").classList.remove("visible");
              
            }, timeDelta);    // try passing the controller's timeDelta here
                       // to capture long-press... worst case, hard code to 80 for tap
            
          
          }
      

      } 
      
      
      else { // catch all for other events like cancel

        // just hide the indicator wherever it is
        //document.querySelector("#buddyup-touch-indicator").classList.remove("visible");

      }
 

    }


  }, // end incoming socket message handler


  
  // relay hardware button event
  sendHardwareEvent: function (inEventType) {
    
    if (SocketTransport.clientType == "controller") {

      BuddyUp.log("trying to relay hardware event as: " + SocketTransport.clientType);
      
      BuddyUp.log("SENDING HARDWARE EVENT");
    
      var timestamp = new Date().getTime();
      
      var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "hardwareButton", "status": "ok", "hardwareEvent": "' + inEventType + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

      SocketTransport.socket.send(msg);
    
     }
    
  },
  
  
  // relay event to the server
  sendEvent: function (inEvent, inTargetID, inNodeName) {

    // block touches on the BuddyUp interface itself!
    
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    console.log("CHECKING TARGET ID");
    console.log(inTargetID.id);
    
    if (inTargetID.id == "buddyup-control-panel") {
      return; 
    }
    
    if (SocketTransport.isOpen) {
      
    
      BuddyUp.log("trying to relay as: " + SocketTransport.clientType);

      this.callCount ++;

      //if (! document.querySelector('#buddyup-socket-status span')) {
      //  document.querySelector('#buddyup-socket-status').innerHTML += "<span>0</span>"; 
      //}

      //document.querySelector('#buddyup-socket-status span').innerHTML = 
       //   this.callCount;

      if (! SocketTransport.socket.send) {

         document.querySelector('#buddyup-connection-status').innerHTML = "NO SOCKET";
         return;
      }


      if (SocketTransport.clientType == "controller") {

        BuddyUp.log("SENDING EVENT");

        var evt = BuddyUp.unSynthetizeEvent(inEvent);
        evt[2][0] = evt[2][0] * 1.25;
        evt[3][0] = evt[3][0] * 1.25;
        
        
        var evtString = JSON.stringify(evt);
        
        
        
        evtString = evtString.replace(/"/g, "'");

        BuddyUp.log("EVENT STRING");
        BuddyUp.log(evtString);


        //! TBD!  Follow action time stamps on controller and repro on client with accurate time...
        var timestamp = new Date().getTime();

        var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "targetID": "' + inTargetID + '", "nodeName": "' + inNodeName + '", "status": "ok", "uiEvent": "' + evtString + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';


        try {
          SocketTransport.socket.send(msg);
        }
        catch(er){
          //SocketTransport.queueEvent(inEvent, inTargetID, inNodeName);
          BuddyUp.log("SOCKET ERROR, event not sent!!!! " + er.message);

          SocketTransport.recoverIfYouCan();
        }

      } 
  
    
    } // end isOpen check
    else {
     
      console.log("SOCKET NO OPEN, EVENT NOT SENT");
      
    }
      
  }, // end sendEvent
  
  
  // catch all error coverage, on socket errors, we will try to
  // reconnect every second for up to 120 seconds!
  recoveryQueueMessage: null,
  recoveryTries: 0,
  recoveryInterval: 0,
  recoverIfYouCan: function socket_recover(inMessage) {
    
    if (SocketTransport.recoveryTries < 1) { // that is, if we're already in a recovery loop, don't try again
    
      if (inMessage) {
        SocketTransport.recoveryQueueMessage = inMessage;
    
      }
      
      if (! SocketTransport.recoveryInterval) {
        SocketTransport.recoveryInterval = setInterval(SocketTransport.tryRecover, 1000);
      }
      
    } // end if recoveryTries check
  }, 
  
  tryRecover: function() {
    
    SocketTransport.recoveryTries ++;
    
    console.log("runnign recovery loop: try # " + SocketTransport.recoveryTries);
    
    if (SocketTransport.recoveryTries < 120) {
        
      try {
        
        SocketTransport.openNewSocketCx(
          BuddyUp.socketServer, BuddyUp.socketProtocol, BuddyUp.clientType, BuddyUp.groupID
        );
      }
      catch(er) {
       
        console.log("SHOW ME: tryRecover couldn't open socket, " + er.message);
      
      }
  
    }
    else {
       
      console.log("SHOW ME: giving up on trying to reconnect to socket server, trying for 2 minutes");
      
      clearInterval(SocketTransport.recoveryInterval);
      SocketTransport.recoveryTries = 0;
      
    }
  
    
  }


};



BuddyUp.init();



