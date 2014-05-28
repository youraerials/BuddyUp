

document.addEventListener("DOMContentLoaded", function () {
  
  console.log("buddy up client loaded");
  
  
  // on load, spin up the chat connection
  // hard coding all these values for now, should push to config and/or UI
  BuddyUp.socketServer = "showme.bunnyandboar.com:80";
  BuddyUp.socketProtocol = "fxos-showme-protocol";
  BuddyUp.clientType = "client";
  BuddyUp.groupID = "g1";

  BuddyUp.log("TRYING TO CONNECT TO SOCKET SERVER: ");
  BuddyUp.log("server: " + BuddyUp.socketServer + " clientType: " + BuddyUp.clientType + " group: " + BuddyUp.groupID);

  SocketTransport.openNewSocketCx(
      BuddyUp.socketServer, BuddyUp.socketProtocol, BuddyUp.clientType, BuddyUp.groupID
  );
  
  
  var heartbeatInterval = setInterval(function() {
    
    console.log(SocketTransport.socket.readyState);
    
    if (! SocketTransport.socket || 
        ! SocketTransport.socket.readyState || 
        SocketTransport.socket.readyState != 1) {
     
      console.log("SOCKET READY STATE CHANGED!  new state: " + SocketTransport.socket.readyState);
      
      document.querySelector("#chat-reconnect").style.display = "block";
      
    }
    
  }, 5000);
  
  
  
  
  document.getElementById("submit-chat").addEventListener("click", function() {
    
    var chatText = document.getElementById("composer-message").value;
      document.getElementById("composer-message").value = "";
      
      console.log("SENDING CHAT: " + chatText);
          
      document.getElementById("chat-list").innerHTML += '<li data-usertype="client"><p>'+ chatText +'</p><time class="timestamp">' + dateFormat(new Date(), "longTime") + '</time></li>';
      
      var timestamp = new Date().getTime();
      var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "chat", "status": "ok", "chatText": "' + chatText + '", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

      try {
        
        console.log("sending: " + msg);
      
        SocketTransport.socket.send(msg);
      
      }
      catch (er) {
        
        console.log(er);
        
        console.log("couldn't send chat text...");
        
        document.querySelector("#chat-reconnect").style.display = "block";
        
        
      }
    
    
      window.scrollTo(0, document.body.scrollHeight);
    
  }, false);
  
  
  document.getElementById("chat-connect").addEventListener("click", function() {
    
    console.log("CLICK ON CONNECT!");
    
    
    document.querySelector("#demo-status-msg").innerHTML = "Share Screen?";
    document.querySelector("#chat-disconnect").style.display = "block";
    document.querySelector("#chat-connect").style.display = "none";
    
    
    if (window.navigator.mozSettings)
      window.navigator.mozSettings.createLock().set({'buddyup.remotelink.enabled': true});
    
    
    // !TBD: validate / callback for successful connection here.
    // can't really do that from a settings value, more research here!
    //document.getElementById("buddyup-connection-status").innerHTML = "connected!";
    
  
  }, false);
  
  document.getElementById("chat-reconnect").addEventListener("click", function() {
    
    BuddyUp.log("TRYING TO RECONNECT TO SOCKET SERVER: ");
    BuddyUp.log("server: " + BuddyUp.socketServer + " clientType: " + BuddyUp.clientType + " group: " +  BuddyUp.groupID);

    SocketTransport.openNewSocketCx(
      BuddyUp.socketServer, BuddyUp.socketProtocol, BuddyUp.clientType, BuddyUp.groupID
    );
    
  }, false);
  
  document.getElementById("chat-disconnect").addEventListener("click", function() {
    
    console.log("CLICK ON DISCONNECT!");
    
    document.querySelector("#demo-status-msg").innerHTML = "Share Screen?";
    document.querySelector("#chat-disconnect").style.display = "none";
    document.querySelector("#chat-connect").style.display = "block";
    
    
    if (window.navigator.mozSettings)
      window.navigator.mozSettings.createLock().set({'buddyup.remotelink.enabled': false});    
    
  
  }, false);
  
  
  var chatTextField = document.getElementById("composer-message");
    
  chatTextField.addEventListener("focus", function() {

    var timestamp = new Date().getTime();
    var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "typing", "status": "ok", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

    try {
      console.log("sending: " + msg);
      SocketTransport.socket.send(msg);
    }
    catch (er) {
      console.log("couldn't send typing state..."); 
    }

  }, false);

  chatTextField.addEventListener("blur", function() {
    var timestamp = new Date().getTime();
    var msg = '{ "clientID": "' + SocketTransport.clientID + '", "groupID": "' + SocketTransport.groupID + '", "type": "uiEvent", "uiEvent": "donetyping", "status": "ok", "x": 0, "y": 0, "timestamp": ' + timestamp + ' }';

    try {
      console.log("sending: " + msg);
      SocketTransport.socket.send(msg);
    }
    catch (er) {
      console.log("couldn't send typing state..."); 
    }

  }, false);
  
  
  
  if (navigator.mozSetMessageHandler) {
    
    navigator.mozSetMessageHandler('activity', function(activityRequest) {
      var option = activityRequest.source;

      if (option.name === "buddyup") {
        console.log("BUDDY UP CLIENT HANDLING INCOMING ACTIVITY!!!");
      }
    });
  
  }
  
  
});



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

    this.log("BUDDY UP INIT, binding and loading markup...");
    
  },

  
  handleBuddyUp: function (inMessage) {

    BuddyUp.log("HANDLE SHOW ME MESSAGE, inMessage:" + inMessage);

  },
  

  log: function (inLog) {

    if (this.debug && console) {

      // create some hope of finding this in ddms ;-)
      console.log("*** SHOW ME LOG -- " + inLog);
      
      
      

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

      BuddyUp.log("can't create socket, looks like we are offline or... port is blocked? :-/");
      BuddyUp.log(er);
      BuddyUp.log("-----------------------------------------------------------------");
      SocketTransport.socket = false;

    }

    if (SocketTransport.socket) {
      
      

      SocketTransport.clientID = SocketTransport.generateID();
      
      
      // set a timeout for the connection?
      SocketTransport.isOpen = false;
      setTimeout(function() {
        
        if (! SocketTransport.isOpen) {
          
              
        
        }
        
        
      }, 3000);
      

      SocketTransport.socket.addEventListener("open", function (event) {

        SocketTransport.isOpen = true;
        

        document.querySelector("#chat-reconnect").style.display = "none";
        
        BuddyUp.log("SOCKET Connected!");
        
        // say hi to the server!
        var msg = '{ "clientID": "' + SocketTransport.clientID + '", "clientType":"' + SocketTransport.clientType + '", "groupID": "' + SocketTransport.groupID + '", "type": "hello", "status": "ok", "message": "hello", "x": 0, "y": 0 }';
        SocketTransport.socket.send(msg);
        
        if (SocketTransport.clientType == "client") {
         
          
          
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
        
        document.querySelector("#chat-reconnect").style.display = "block";
        
        //BuddyUp.stopScreenCap();
        
        
        if (SocketTransport.clientType != "controller") {
          // send a touchend to reset us if we're clients
          console.log("~~~Sending ERROR STATE TOUCH END");
          
          if (BuddyUp.startEvent) {
            
            BuddyUp.startEvent[0] = "touchend";
            BuddyUp.relayTouchEvent(BuddyUp.origTarget, BuddyUp.startEvent);
          
          }
        }
                

      });

      
      SocketTransport.socket.addEventListener("close", function (event) {
        
        console.log ("SOCKET CLOSING!");
        console.log(event.reason);
        
        document.querySelector("#chat-reconnect").style.display = "block";
        
        SocketTransport.socket = false;
        SocketTransport.isOpen = false;
        
        document.querySelector("#demo-status-msg").innerHTML = "Share Screen?";
        document.querySelector("#chat-disconnect").style.display = "none";
        document.querySelector("#chat-connect").style.display = "block";

      });

    } // end if SocketTransport.socket sanity check
    
    else {

      console.log("NO SOCKET?");
      
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

    
    // handle incoming screen data
    if ( inMessage.uiEvent == "chat" && inMessage.clientID != SocketTransport.clientID ) {
     
      console.log("!!!!! WOW! incoming chat!!"); 
      
      var time = new Date();
      
      var tempTyping = document.querySelector(".temp-typing");
      if (tempTyping) tempTyping.parentNode.removeChild(tempTyping);
      
      document.getElementById("chat-list").innerHTML += '<li data-usertype="controller"><h3>Martin, Firefox OS Helper</h3><img src="assets/avatar.png" class="avatar" /><p>'+ inMessage.chatText +'</p><time class="timestamp">' + dateFormat(new Date(), "longTime") + '</time></li>';
      

      window.scrollTo(0, document.body.scrollHeight);
      
    }
    else if (inMessage.uiEvent == "typing" && inMessage.clientID != SocketTransport.clientID) {
      
      var tempTyping = document.querySelector(".temp-typing");
      if (tempTyping) tempTyping.parentNode.removeChild(tempTyping);
      
      document.getElementById("chat-list").innerHTML += '<li class="temp-typing" data-usertype="controller"><h3>Martin, Firefox OS Helper</h3><img src="assets/avatar.png" class="avatar" /><p><img class="typing-indicator" src="assets/typing.gif"></p></li>';
      
      window.scrollTo(0, document.body.scrollHeight);
      
    }
    else if (inMessage.uiEvent == "donetyping" && inMessage.clientID != SocketTransport.clientID) {
      
      var tempTyping = document.querySelector(".temp-typing");
      if (tempTyping) tempTyping.parentNode.removeChild(tempTyping);
      
      window.scrollTo(0, document.body.scrollHeight);
      
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



      if (! SocketTransport.socket.send) {


         return;
      }


      if (SocketTransport.clientType == "controller") {

        BuddyUp.log("SENDING EVENT");

        var evt = BuddyUp.unSynthetizeEvent(inEvent);
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
        }

      } 
  
    
    } // end isOpen check
    else {
     
      console.log("SOCKET NOT OPEN, EVENT NOT SENT");
      
    }
      
  } // end sendEvent
  
  
  


};



BuddyUp.init();