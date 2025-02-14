 var socket = io();
 // listen for server connection
 // get query params from url
 var name = getQueryVariable("name") || 'Anonymous';
 var room = getQueryVariable("room") || 'General Chat';

 $(".room-title").text(room);
 // fires when client successfully conencts to the server
 socket.on("connect", function() {
   console.log("Connected to Socket I/O Server!");
   console.log(name + " wants to join  " + room);
   // to join a specific room
   socket.emit('joinRoom', {
     name: name,
     room: room
   });
 });

 // below code is to know when typing is there
 var timeout;

 function timeoutFunction() {
   typing = false;
   //console.log("stopped typing");
   // socket.emit("typing", false);
   socket.emit('typing', {
     text: "" //name + " stopped typing"
   });
 }
 // if key is pressed typing message is seen else auto after 2 sec typing false message is send
 // TODO : add broadcast event when server receives typing event
 $('#messagebox').keyup(function() {
   console.log('happening');
   typing = true;
   $("#icon-type").removeClass();
   //console.log("typing typing ....");
   //socket.emit('typing', 'typing...');
   socket.emit('typing', {
     text: name + " is typing ..."
   });
   clearTimeout(timeout);
   timeout = setTimeout(timeoutFunction, 1000);
 });

 // below is the checking for page visibility api
 var hidden, visibilityChange;
 if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
   hidden = "hidden";
   visibilityChange = "visibilitychange";
 } else if (typeof document.mozHidden !== "undefined") {
   hidden = "mozHidden";
   visibilityChange = "mozvisibilitychange";
 } else if (typeof document.msHidden !== "undefined") {
   hidden = "msHidden";
   visibilityChange = "msvisibilitychange";
 } else if (typeof document.webkitHidden !== "undefined") {
   hidden = "webkitHidden";
   visibilityChange = "webkitvisibilitychange";
 }


 //listening for typing  event
 socket.on("typing", function(message) { //console.log(message.text);
   $(".typing").text(message.text);
 });

 socket.on("userSeen", function(msg) {

  // if (msg.user == name) {
     // read message
     // show messags only to user who has typied
     var icon = $("#icon-type");
     icon.removeClass();
     icon.addClass("fa fa-check-circle");
     if (msg.read) {
       //user read the message
       icon.addClass("msg-read");
     } else {
       // message deleiverd but not read yet
       icon.addClass("msg-delieverd");
     }
     console.log(msg);
   //}
 });


 //setup for custom events
 socket.on("message", function(message) {
   console.log("New Message !");
   console.log(message.text);
   // insert messages in container
   var $messages = $(".messages");
   var $message = $('<li class = "list-group-item"></li>');

   var momentTimestamp = moment.utc(message.timestamp).local().format("h:mm a");
   //$(".messages").append($('<p>').text(message.text));
   $message.append("<strong>" + momentTimestamp + " | " + message.name + "</strong>");
   $message.append("<p>" + message.text + "</p>");
   $messages.append($message);
   // handle autoscroll
   // manage autoscroll
   var obj = $("ul.messages.list-group");
   var offset = obj.offset();
   var scrollLength = obj[0].scrollHeight;
   //  offset.top += 20;
   $("ul.messages.list-group").animate({
     scrollTop: scrollLength - offset.top
   });

   // try notify , only when user has not open chat view
   if (document[hidden]) {
     notifyMe(message);
     // also notify server that user has not seen messgae
     var umsg = {
       text: name + " has not seen message",
       read: false
     };
     socket.emit("userSeen", umsg);
   } else {
     // notify  server that user has seen message
     var umsg = {
       text: name + " has seen message",
       read: true,
       user: name
     };
     socket.emit("userSeen", umsg);
   }
 });

 // handles submitting of new message
 var $form = $("#messageForm");
 var $message1 = $form.find('input[name=message]');
 $form.on("submit", function(event) {
   event.preventDefault();
   var msg = $message1.val();
   //prevent js injection attack
   msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
   if (msg === "") return -1; //empty messages cannot be sent

   socket.emit("message", {
     text: msg,
     name: name
   });
   // show user messageForm
   var $messages = $(".messages");
   var $message = $('<li class = "list-group-item"></li>');

   var momentTimestamp = moment().format("h:mm a");
   // $(".messages").append($('<p>').text(message.text));
   $message.append("<strong>" + momentTimestamp + " | " + name + "</strong>");
   //$message.append("<p>" + $message1.val()+ "</p>");
   $message.append($("<p>", {
     class: "mymessages",
     text: $message1.val()
   }));
   $messages.append($message);
   $message1.val('');
  if ($message === "?members")
  {
    socket.emit("message", {
    name: "Synergo",
    text: "Current Users : " + users.join(', '),
    timestamp: moment().valueOf()
  });

  }
   // manage autoscroll
   var obj = $("ul.messages.list-group");
   var offset = obj.offset();
   var scrollLength = obj[0].scrollHeight;
   //  offset.top += 20;
   $("ul.messages.list-group").animate({
     scrollTop: scrollLength - offset.top
   });

 });

 // notification message
 function notifyMe(msg) {
   // Let's check if the browser supports notifications
   if (!("Notification" in window)) {
     alert("This browser does not support desktop notification,try Chromium!");
   }

   // Let's check whether notification permissions have already been granted
   else if (Notification.permission === "granted") {
     // If it's okay let's create a notification
     //  var notification = new Notification(msg);
     var notification = new Notification('Chat App', {
       body: msg.name + ": " + msg.text,
       icon: '/images/apple-icon.png' // optional
     });
     notification.onclick = function(event) {
       event.preventDefault();
       this.close();
       // assume user would see message so broadcast userSeen event
       var umsg = {
         text: name + " has seen message",
         read: true,
         user: name
       };
       socket.emit("userSeen", umsg);
       //window.open('http://www.mozilla.org', '_blank');
     };
   }
   // Otherwise, we need to ask the user for permission
   else if (Notification.permission !== 'denied') {
     Notification.requestPermission(function(permission) {
       // If the user accepts, let's create a notification
       if (permission === "granted") {
         var notification = new Notification('Chat App', {
           body: msg.name + ": " + msg.text,
           icon: '/images/apple-icon.png' // optional
         });
         notification.onclick = function(event) {
           event.preventDefault();
           this.close();
           var umsg = {
             text: name + " has seen message",
             read: true,
             user: name
           };
           socket.emit("userSeen", umsg);
           // assume user would see message so broadcast userSeen event
           //window.open('http://www.mozilla.org', '_blank');
         };
       }
     });
   }

   // At last, if the user has denied notifications, and you
   // want to be respectful there is no need to bother them any more.
 }
