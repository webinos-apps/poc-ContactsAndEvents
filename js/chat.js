var chat1 = {}; //this will hold other variables to avoid global namespace pollution
var chat1Elements = {}; //this will hold html elements so we can avoid excessive DOM search

// Set initial values
chat1.users = [];
chat1.useMyDeck = false;

chat1.settings = {};
chat1.settings.predefined = {
	color: "black",
	fontFamily: "sans-serif",          
	fontSize: "100%"
};
chat1.settings.opponent = {};
chat1.settings.mine = {};
//we can't copy the whole object, because they would be tied together;
//possible TODO: add object cloning function (but right now this is enough)
chat1.settings.opponent.color = chat1.settings.mine.color = chat1.settings.predefined.color;
chat1.settings.opponent.fontFamily = chat1.settings.mine.fontFamily = chat1.settings.predefined.fontFamily;
chat1.settings.opponent.fontSize = chat1.settings.mine.fontSize = chat1.settings.predefined.fontSize;

chat1.invisible = false;


/* GENERAL USE functions */

//TODO: I would opt for using indexOf instead of RegExp's
function hasClass(ele,cls) {
	return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
};

function addClass(ele,cls) {
	if(ele != null) {
		if (!hasClass(ele,cls)) ele.className += " "+cls;
	}
};

function removeClass(ele,cls) {
	if(ele != null) {
		if (hasClass(ele,cls)) {
			var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
			ele.className=ele.className.replace(reg,' ');
		}
	}
};


/* functions creating and dispatching WEBINOS EVENTS */


function sendStatus(type, engaged) {
	var callback = {};
	var ev = eventAPIToUse.createWebinosEvent(type);
	ev.payload = {
		type: type,
		user: chat1.myName
	};
	if(engaged) ev.payload.status = chat1.engaged;
	ev.dispatchWebinosEvent(callback);
};

function sendMsg(msgType, msgData) {
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	ev.payload = {
		type: msgType,
		sender: chat1.myName,
		receiver: chat1.oName,
		data: msgData
	};
   	ev.dispatchWebinosEvent(callback);
};

function sendInvitation(type, inviter, invitee) {
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	ev.payload = {
		type: type,
		inviter: inviter,
		invitee: invitee
	};
   	ev.dispatchWebinosEvent(callback);
}


/* Equivalent to jquery's ready()
 * Notifies listeners when the DOM finished parsing (while images and css may still load) */


(function(){
	var readyListener = [];

	var loaded = function() {
		window.removeEventListener("load", loaded, false);
		document.removeEventListener("DOMContentLoaded", loaded, false);

		for (var i = 0; i < readyListener.length; i++) {
			setTimeout(readyListener[i], 1);
		}
		readyListener = [];
	};

	// The case where ready() is called after the DOM is loaded already
	if (document.readyState === "complete") {
		// Handle it asynchronously to allow scripts the opportunity to delay ready
		return setTimeout(loaded, 1);
	};

	if (document.addEventListener) {
		document.addEventListener("DOMContentLoaded", loaded, false);

		// A fallback to window.onload, that will always work
		window.addEventListener("load", loaded, false);
	};

	// Call this to register your DOM ready listener function
	ready = function(listener) {
		readyListener.push(listener);
	};
})();


// function added by Polito
// this is a workaround. In the future, in multi-PZH scenarios, the plan is to obtain the userID from the platform.
// However, the option to change the userID obtained could be kept, keeping the following mechanism as well.
ready(function() {
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'),
		{
		onFound: function(service){
			eventAPIToUse = service;
			chat1.unavailableNames = [];
			chat1.myName = webinos.messageHandler.getOwnId();

			var listenerID = eventAPIToUse.addWebinosEventListener(function(event){
				if (event.payload.type === 'nameResponse') {
					chat1.unavailableNames.push(event.payload.user);
				}
			});

			sendStatus('nameQuery');

			setTimeout(function() {nameInput(listenerID)}, 3000); //TODO check why there's a timeout here
		}
	});

	//rip out of dom elements, that we will frequently use later
	chat1Elements.status = document.getElementById("status-text");
	chat1Elements.contButton = document.getElementById("cont-button");
	chat1Elements.onlineContacts = document.getElementById("onlineContacts");
	chat1Elements.liveInvitations = document.getElementById("liveInvitations");

	chat1Elements.home = document.getElementById("home");
	chat1Elements.app = document.getElementById("app");
	chat1Elements.settings = document.getElementById("sett");
	chat1Elements.password = document.getElementById("password");

	chat1Elements.homeScreenName = document.getElementById("myName2");
	chat1Elements.frontStatus = document.getElementById("frontStatus");

	chat1Elements.newElem = document.getElementById("newElem");
	chat1Elements.endElem = document.getElementById("endElem");
	chat1Elements.endButton = document.getElementById("endButton");
	chat1Elements.setButton = document.getElementById("setButton");

	chat1Elements.chat = document.getElementById("chat");
	chat1Elements.chatBox = document.getElementById("chatBox");
	chat1Elements.chatText = document.getElementById("chatText");
	chat1Elements.chatButton = document.getElementById("chatButton");
	chat1Elements.chatInput = document.getElementById("chatInput");
	chat1Elements.textButton = document.getElementById("textButton");

	//set initial onclick actions
	chat1Elements.textButton.onclick = function() {showTextChat();};
	chat1Elements.endButton.onclick = function() {confirmExitapp();};
	chat1Elements.setButton.onclick = function() {setSettings();};
	chat1Elements.chatButton.onclick = function() {sendChat();};

	chat1Elements.chatInput.onkeypress = function() {if (event.keyCode==13) sendChat()};

	document.getElementById("cancelsettings").onclick = function() {cancelSettings();};
	document.getElementById("savesettings").onclick = function() {saveSettings();};
});


window.onbeforeunload = function(){ //that's probably unreliable
   	sendStatus('logout');
   	sendStatus('appClosed');
};


function nameInput(listenerID) {
	chat1.myName = prompt("please, insert your name");

	while (chat1.myName === '' || chat1.unavailableNames.indexOf(chat1.myName) !== -1) {
		chat1.myName = prompt("please insert a different name");
	}

	eventAPIToUse.removeWebinosEventListener(listenerID);

	if (chat1.myName !== null && chat1.myName !== undefined && chat1.myName !== '') {
		start();
		setScreenName();
	} else {
		alert('username is missing');
	}
};


// function modified by Polito
// this is the former ready function, renamed to start and called from the current ready function
var start = function() {

	eventAPIToUse.addWebinosEventListener(function(event){
		//debug
		/*for(var i in chat1.users) {
			console.log(chat1.users[i]);
		}*/

		switch(event.payload.type){
		// event added by Polito
		case 'nameQuery':
			sendStatus('nameResponse');
			break;

		case 'login':
			if (event.payload.user !== chat1.myName){
				if(typeof chat1.users[event.payload.user] === 'undefined' || chat1.users[event.payload.user] === 'offline'){
					chat1.users[event.payload.user] = event.addressing.source;
					if(userNotListed(event.payload.user)){
						addContact(event.payload.user);
					}
				}
				//if im not invisible i send the event online
				if(!chat1.invisible) {
					sendStatus('online', true);
				}
			}
			break;

		case 'online':	//modified the filter for the policy management A. Longo 24.04.12
			if (event.payload.user !== chat1.myName &&
					(typeof chat1.users[event.payload.user] === 'undefined' || chat1.users[event.payload.user] == 'offline')
			){ // Filter
				chat1.users[event.payload.user] = event.addressing.source;

				//if the player status is not chat1.engaged, i can invite him to play
				if(typeof event.payload.status == 'undefined' || event.payload.status == '') {
					addContact(event.payload.user);
				} else { //otherwise the UI shows that the player is currently chatting
					addContact(event.payload.user);
					setContactchatting(event.payload.user);
				}
			}
			break;

		case 'logout':
			chat1.users[event.payload.user] = 'offline';

			if (chat1.engaged != event.payload.user) {
				removeContact(event.payload.user);
			} else {
				//TODO check why it's like that, with a loop, instead of a remove
				chat1Elements.onlineContacts.innerHTML = '';
				for (var user in chat1.users) {
					if (chat1.users[user] !== 'offline') {
						addContact(user);
					}
				}
			}
			break;

		case 'appClosed':
				if(event.payload.user === chat1.engaged) {
					setStatusMessage(chat1.oName + " closed the app!");

					resetApp();

					//if i'm not invisible i send the event loging, showing my presence
					if(!chat1.invisible) {
						sendStatus('login');
					}

					sendStatus('notchatting');

					setTimeout(appClosed,3000); //TODO why the timeout
				}
			break;

		case 'invite':
			if(event.payload.invitee === chat1.myName && !invitationExists(user)) {
				addInvitation(event.payload.inviter);
			}
			break;

		case 'cancelInvite':
			if(event.payload.invitee === chat1.myName) {
				removeInvitation(event.payload.inviter);
			}
			break;

		case 'acceptInvitation':
			if(event.payload.inviter === chat1.myName) {
				chat1.engaged = event.payload.invitee;
               // showTextChat();
				setappUI();
				showapp();

			//	sendStatus('chatting');
				// Enter Stage 3: Start the app.
			}
			break;

		case 'chatting':
			if(event.payload.user != chat1.myName) {
				if (userNotListed(event.payload.user)) {
					addContact(event.payload.user);
					setContactchatting(event.payload.user);
				} else {
					setContactchatting(event.payload.user);
				}

				//if one of the player who changed state in chatting, had invited me, i remove the invitation
				removeInvitation(event.payload.user);
			}
			break;

		case 'notchatting':
			if(event.payload.user != chat1.myName) {
				if (!userNotListed(event.payload.user)) {
					resetContact(event.payload.user);
				}
			}
			break;

		case 'sendDeckData':
			if(event.payload.receiver === chat1.myName) {
				chat1.cardData = JSON.parse(event.payload.data);
				appInit();
			}
			break;

		case 'chat':
			if(event.payload.receiver === chat1.myName) {
				pasteChatMsg(event.payload.sender, event.payload.data);
				scrollDownChatBox();

				//indicates incoming chat messages
				if(chat1Elements.chat.style.display == "none" || chat1Elements.chat.style.display == "") { //TODO?
					chat1Elements.textButton.style.border = "3px solid red";
				}
			}
			break;

		case 'newapp':
			if(event.payload.receiver === chat1.myName) {
				setStatusMessage(event.payload.sender+' wants to start a New chat', 'black');
				setContButton('newchat');
				appt.newappProposal = true;
			}
			break;

		case 'newappAccepted':
			if(event.payload.receiver === chat1.myName) {
				newappAccepted(true);
			}
			break;

		case 'newappRefused':
			if(event.payload.receiver === chat1.myName) {
				appt.newappProposal = false;
				updateUI();
				appendStatusMessage(event.payload.sender+ " refused to start a new chat!");
			}
			if(appt.currentTurn) {
				setContButton('continue');
			} else {
				setContButton('empty');
			}
			break;
		} // End of switch(event.payload.type)
	});

	// commented out by Polito
	/*function getURLParameter(name) {
		return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
	}
	chat1.myName = getURLParameter("user");*/
	if(!chat1.invisible) {
		sendStatus('login');
	}
};


/* HTML-related functions */


function setScreenName() {
	chat1Elements.homeScreenName.innerHTML = "Your screen name: <b>"+chat1.myName+"</b>";
	chat1Elements.frontStatus.innerHTML = "Connected to webinos";
}

//2 "screens" per function should be sufficient, but more could be added
function showHome() {
	chat1Elements.home.style.display = 'block';
	chat1Elements.app.style.display = 'none';

	chat1Elements.homeScreenName.style.display = 'block';
}
function showapp() {
	chat1Elements.home.style.display = 'none';
	chat1Elements.app.style.display = 'block';

	chat1Elements.homeScreenName.style.display = 'none';
}

function showSettings() {
	chat1Elements.app.style.display = 'none';
	chat1Elements.settings.style.display = 'block';
}
function hideSettings() {
	chat1Elements.app.style.display = 'block';
	chat1Elements.settings.style.display = 'none';
}

function showDecks() {
	document.getElementById("deck-box").style.display = 'block';
	document.getElementById("play-box").style.display = 'none';
}
function hideDecks() {
	document.getElementById("deck-box").style.display = 'none';
	document.getElementById("play-box").style.display = 'block';
}

function closePopup() {
 /*  chat1Elements.opacityBack.style.display = "none";
   chat1Elements.popup.style.display = "none";
   chat1Elements.password.value = ''; */
}

function openPopup() {
  /* chat1Elements.opacityBack.style.display = "block";
   chat1Elements.popup.style.display = "table"; */
}


function userNotListed(user) {
	if (document.getElementById('liContact' + user) == null) {
		return true;
	}
}
function invitationExists(user) {
	if(document.getElementById("liInviter" + user) != null) {
		return true;
	}
}

function addContact(user) {
	var li = document.createElement('li');
	li.id = 'liContact'+user;

	var label = document.createElement('label');
	label.id = 'labelContact'+user;
	label.appendChild(document.createTextNode(user));
	li.appendChild(label);

	var anch = document.createElement('a');
	anch.id = 'abuttonContact'+user;
	anch.className = "button";
	anch.onclick = function() {onclickContactAction(user)};
	anch.appendChild(document.createTextNode("Invite"));
	li.appendChild(anch);

	chat1Elements.onlineContacts.appendChild(li);
}
function setContactchatting(user) {
	var anch = document.getElementById('abuttonContact' + user);
	addClass(anch,'red');
	anch.onclick = null;
	anch.firstChild.nodeValue = "chatting";
}
function setContactAsInvited(user) {
	var label = document.getElementById('labelContact' + user);
	label.innerHTML = "Inviting <span>"+user+"</span>...Waiting for response...";
	var anch = document.getElementById('abuttonContact' + user);
	addClass(anch,'red');
	anch.onclick = function() {cancelInvitation(user)};
	anch.firstChild.nodeValue = "Cancel";
}
function resetContact(user, resetLabel) {
	if(resetLabel) {
		var label = document.getElementById('labelContact' + user);
		label.innerHTML = user;
	}
	var anch = document.getElementById('abuttonContact' + user);
	removeClass(anch,'red');
	anch.onclick = function() {onclickContactAction(user)};
	anch.firstChild.nodeValue = "Invite";
}

function removeContact(user) {
	//remove the player from the list
	licontact = document.getElementById("liContact" + user);
	if(licontact != null) {
		chat1Elements.onlineContacts.removeChild(licontact);
	}
	//if the player who is logging out, had invited me, i remove the invitation
	removeInvitation(user);
}

function addInvitation(user) {
	var li = document.createElement('li');
	li.id = 'liInviter'+user;

	var label = document.createElement('label');
	var span = document.createElement('span');
	span.appendChild(document.createTextNode(user));
	label.appendChild(span);
	label.appendChild(document.createTextNode(" invites you for a Chat."));
	li.appendChild(label);

	var anch = document.createElement('a');
	anch.className = "button";
	anch.onclick = function() {acceptInvitation(user)};
	anch.appendChild(document.createTextNode("Accept"));
	li.appendChild(anch);

	chat1Elements.liveInvitations.appendChild(li);
}

function removeInvitation(user) {
	var invitation = document.getElementById("liInviter" + user);
	if(invitation) chat1Elements.liveInvitations.removeChild(invitation);
}

function setStatusMessage(msg, className, add) { //you can skip the third param and use wrapper below; if no className - reset/remove classes
	if(add) {
		chat1Elements.status.innerHTML += '<br>'+msg;
	} else {
		chat1Elements.status.innerHTML = msg;
	}
	if(className) {
		chat1Elements.status.className = className;
	} else {
		chat1Elements.status.removeAttribute("class");
	}
}
function appendStatusMessage(msg, className) {
	setStatusMessage(msg, className, true);
}

function setContButton(opt) {
	var content;
	switch(opt) {
		case 'empty':
			content = '';
			break;
		case 'continue':
			content = '<a id="continue" class="button" onClick="cont();">Continue</a>';
			break;
		case 'start':
			content = '<a href="#" id="play" class="button" onClick="play();">Start</a>';
			break;
		case 'exit':
			content = '<a class="button" onClick="exitapp();">OK</a><a class="button red" onClick="cancelExitapp();">Cancel</a>';
			break;
		case 'newapp':
			content = '<a class="button" onClick="newappAccepted(false);">OK</a><a class="button red" onClick="newappRefused();">Cancel</a>';
			break;
		case 'newapp+':
			content = '<a class="button" onClick="newappAccepted(false);">Yes</a><a class="button red" onClick="exitapp();">No</a>';
			break;
	}
	chat1Elements.contButton.innerHTML = content;
}

function showTextChat() {
   chat1Elements.chat.style.display = 'table-row';
   chat1Elements.textButton.onclick = function() { hideTextChat(); };
   //added to remove the incoming message notification A. Longo 30.04
   chat1Elements.textButton.style.border = 'none';
}

function hideTextChat() {
   chat1Elements.chat.style.display = 'none';
   chat1Elements.textButton.onclick = function() { showTextChat(); };
}



//app UI
function setappUI(){
//	chat1Elements.myName.innerHTML = chat1.myName;
//	chat1Elements.opponentName.innerHTML = chat1.oName;
//	document.getElementById("chatBox").innerHTML = '<input type="text" id="chatBx" height="200">';

	//var newElem = document.getElementById("newElem");
	//newElem.className = 'disabled';
	//var endElem = document.getElementById("endElem");
	//endElem.className = 'disabled';

	//choseDecks();
	showTextChat();

	//initialize chat settings

	/*if(chat1.useMyDeck) {
		choseDeck();
		//showTextChat();
	} else {
		setStatusMessage("Waiting for the dealer...");
	}*/
};

//sends user's chat message
function sendChat() {
	var msg = chat1Elements.chatInput.value;
	if(msg!='') {
		chat1Elements.chatInput.value = "";
		sendMsg('chat', msg);
		pasteChatMsg(chat1.myName, msg);
		scrollDownChatBox();
	}
};

function pasteChatMsg(sender, msg) {
	var senderName,
		settings,
		pClass;
	if(sender == chat1.myName) {
		senderName = 'Me';
		settings = chat1.settings.mine;
		pClass = '';
	} else {
		senderName = sender;
		settings = chat1.settings.opponent;
		pClass = ' class="opponentLine"';
	}

	chat1Elements.chatBox.innerHTML += '<p'+pClass+'><span style="font-size:'+settings.fontSize+';color:'+settings.color+'">'+senderName+': </span><span style="font-family:\''+settings.fontFamily+'\';font-size:'+settings.fontSize+';color:'+settings.color+'">' + msg + '</span></p>';
}

function scrollDownChatBox() {
	chat1Elements.chatBox.scrollTop = chat1Elements.chatBox.scrollHeight;
}

function setSettings() {
	//	THOSE SETTINGS ARE OBSOLETE AND _BADLY IMPLEMENTED_!
	//	but in the future - if stuff could be saved- settings should ALWAYS be put to chat1.settings
	//	the settings itself could be generated dynamically with this function, and options would have an index
	//	going in/from the chat1.settings (and not for example "150%")
	//	So this function should be invoked then ONCE at start, and the settings button would have onclick=showSettings

	//load previous settings in the dropdown lists
	/*document.getElementById("mcolor").selectedIndex = getColorIndex(document.getElementById("chatInput").style.color);
	document.getElementById("mfamily").selectedIndex = getFamilyIndex(document.getElementById("chatInput").style.fontFamily);
	document.getElementById("msize").selectedIndex = getSizeIndex(document.getElementById("chatInput").style.fontSize);
	document.getElementById("ocolor").selectedIndex = getColorIndex(chat1.settings.opponent.color);
	document.getElementById("ofamily").selectedIndex = getFamilyIndex(chat1.settings.opponent.fontFamily);
	document.getElementById("osize").selectedIndex = getSizeIndex(chat1.settings.opponent.fontSize);
	if(chat1.invisible) {
		document.getElementById("mstatus").selectedIndex = 1;
	}*/

	showSettings();
};

function saveSettings() {
	mfc = document.getElementById("mcolor");
	chat1.settings.mine.color = mfc.options[mfc.selectedIndex].value;
	mff = document.getElementById("mfamily");
	chat1.settings.mine.fontFamily = mff.options[mff.selectedIndex].value;
	mfs = document.getElementById("msize");
	chat1.settings.mine.fontSize = mfs.options[mfs.selectedIndex].value;

	ofc = document.getElementById("ocolor");
	chat1.settings.opponent.color = ofc.options[ofc.selectedIndex].value;
	off = document.getElementById("ofamily");
	chat1.settings.opponent.fontFamily = off.options[off.selectedIndex].value;
	ofs = document.getElementById("osize");
	chat1.settings.opponent.fontSize = ofs.options[ofs.selectedIndex].value;

//apply
	chat1Elements.chatInput.style.color = chat1.settings.mine.color;
	chat1Elements.chatInput.style.fontFamily = chat1.settings.mine.fontFamily;
	chat1Elements.chatInput.style.fontSize = chat1.settings.mine.fontSize;

	mst = document.getElementById("mstatus");
	chat1.users[chat1.myName] = mst.options[mst.selectedIndex].value;

	if(chat1.users[chat1.myName] == 'offline') {
		chat1.invisible = true;
		sendStatus('logout', true);
	} else {
		chat1.invisible = false;
		sendStatus('online', true);
	}

	hideSettings();
	scrollDownChatBox();
};

function cancelSettings() {
	hideSettings();
	scrollDownChatBox();
};


/* ONCLICK actions */


// mark option on a card
function mark(attr) {
	if((attr == null || appt.currentTurn) && !appt.newappProposal) {
		for(var i=1; i<=5; i++) {
			removeClass(document.getElementById('c1attr'+i),'marked');
		}
		addClass(document.getElementById(attr),'marked');
	}
};

function onclickContactAction(contactName) {
	// Invite and go to Stage 2, waiting for response from invitee.
	setContactAsInvited(contactName)
	sendInvitation('invite', chat1.myName, contactName);
/*	alert(displayName);
	alert(contactName);
if (displayName == contactName) {
   	sendInvitation('invite', chat1.myName, contactName);
}
else {
    setStatusMessage('contact not in your List...');
}*/
	chat1.useMyDeck = true;
	chat1.oName = contactName;
}

function cancelInvitation(invitee){
	resetContact(invitee, true);

   	sendInvitation('cancelInvite', chat1.myName, invitee);

	chat1.useMyDeck = false;
	chat1.oName = "";
}

function acceptInvitation(inviter){
	chat1.oName = inviter;
	chat1.useMyDeck = false;
	chat1.engaged = inviter;

    // Enter Stage 3: Start the app.
	setappUI();
	showapp();

   	sendInvitation('acceptInvitation', inviter, chat1.myName);

	sendStatus('chatting');
};

function confirmExitapp() {
	setStatusMessage('Are you sure you want to exit?', 'black');
    setContButton('exit');
};

function cancelExitapp() {
	setContButton('empty');
	if(chat1.useMyDeck) {
		 setStatusMessage('Click Start to Chat');
		 setContButton('start');
	} else {
		 setStatusMessage('Waiting for online contact...');
	}
	if(typeof appt != 'undefined' && appt != null && appt.started) {
		updateUI();
		if(appt.currentTurn) {
			setContButton('continue');
		} else {
			setContButton('empty');
		}
	}
};

function appClosed() {
	showHome();
};

function anotherapp() {
	if(chat1.useMyDeck) {
	   setStatusMessage('New app?');
	   setContButton('newapp+');
	}
	else {
		setStatusMessage('Waiting for online contact...');
	}
};

function newapp(){
	if(appt && appt.inputEnable) {
		setContButton('empty');
		setStatusMessage("Waiting for an answer...");
		appt.newappProposal = true;
		sendMsg('newapp', null);
	} else {
		setStatusMessage("Not Allowed!");
	}
};

function exitapp() {
   	sendStatus('appClosed');
	sendStatus('notchatting');

	// modified by Polito
	// in order to not exit from the app but just from the app

	//location.reload();

	resetApp();
	appClosed();

	//if i'm not invisible i send the event login, showing my presence
	if(!chat1.invisible) {
		sendStatus('login');
	}

	// end of Polito modifications
};

function resetApp() {
	//var reset
	chat1.users = [];
	chat1.engaged = '';
	chat1.useMyDeck = false;
	chat1.oName = "";

	//reset cards and buttons
	switchUICard("1", "b", "");
	switchUICard("2", "b", "");
	setContButton('empty');
	chat1Elements.newElem.className = "button2";
	chat1Elements.endElem.className = "button2";

	//reset contacts
	chat1Elements.onlineContacts.innerHTML = '';
	chat1Elements.liveInvitations.innerHTML = '';

	//reset chat history
	chat1Elements.chatBox.innerHTML = '';
}

// End of file.
