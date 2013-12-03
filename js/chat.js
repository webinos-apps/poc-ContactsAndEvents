/* Modified the 13/2/2013 By Krishna Bangalore and Elena Medvedeva */

var chat = {}; //this will hold other variables to avoid global namespace pollution
var chatElements = {}; //this will hold html elements so we can avoid excessive DOM search

/*File API Part to Retrieve the User Data from Settings*/
chat.fileService = null;
chat.fileSystem = null;

chat.getSettings = function(successcb, errorcb){
	 chat.getFileService(function (svc) {
		 chat.getDirectories(chat.fileService, function (fs, dirs) {			 
			 dirs.settingsdir.getFile("settings.json",
					 {create: false},
					 function(fileEntry) {
						 chat.fileToObject(fs,fileEntry,successcb, errorcb);
					 },
			            errorcb);
        }, function (err) {
            console.log(err.code);
            errorcb(err);
        });
	    }, function (err) {
	        console.log(err.code);
	        errorcb(err);
	    });
};

chat.fileToObject = function(fs, fileEntry, successcb, errorcb) {
    fileEntry.file(function (file) {
        var reader = new window.FileReader(fs);
        reader.onloadend = function (evt) {
            if (evt.target.readyState === FileReader.DONE && evt.target.result !== "") {
                var setting = JSON.parse(evt.target.result);
                successcb(setting);
            } else {
                errorcb("You're probably using Chrome, which isn't supported as this local file uses the file API");
            }
        };
        reader.readAsText(file);
    }, errorcb);
};



chat.getDirectories = function(fileService, successcb, errorcb) {
	console.log("fileService=", fileService);
    chat.getFileSystem(fileService, onInitFs, fsErrorHandler);

    function onInitFs(fs) {
        fileSystem = fs;
        fs.root.getDirectory(STORE_DIRECTORY, {
            create: true
        }, function (approot) {
             approot.getDirectory(SETTINGS_DIRECTORY, {
                    create: true
                }, function (settings) {
                    successcb(fs, {
                        "appdir": approot,
                        "settingsdir": settings                        
                    });
                }, fsErrorHandler);            
        }, fsErrorHandler);
    }

    function fsErrorHandler(err) {
        console.log("Failed to request file system");
        chat.errorHandler(err);
        errorcb(err);
    }
};

chat.getFileSystem = function(fileService, successcb, errorcb) {
    if (chat.fileSystem !== null) {
        successcb(fileSystem);
    } else {
        fileService.requestFileSystem(window.PERSISTENT, 5 * 1024 * 1024, successcb, errorcb);
    }
};

chat.getFileService = function(successcb, errorcb) {
    if (chat.fileService !== null) {
        successcb(chat.fileService);
        return;
    }
    var once = false;


    function find() {
        webinos.discovery.findServices(
        new ServiceType('http://webinos.org/api/file'), {
            onFound: onServiceFound
        });
    }

    function onServiceFound(service) {
        if (!once) {
            once = true;
            bind(service);
        } else {
            console.log("Not bound : " + service.serviceAddress);
            errorcb("Failed to bind to webinos file service");
        }
    }

    function bind(service) {
        service.bindService({
            onBind: function (boundService) {
                chat.fileService = boundService;
                successcb(boundService);
            }
        });
    }

    find();

};

chat.errorHandler = function(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
            break;
    }

    console.log('Error: ' + msg);
    return "Error: " + msg;
};

/*
chat.getSettings(function (data) {
		 		console.log("Settings!!!! ", data);
				chatElements.homeScreenName.innerHTML = "Your screen name: <b>"+data.chatusr+"</b>";
				chat.myName = data.chatusr;
				alert("Hi3");
				alert (chat.myName); */
			/*	$("#chatusernameText").val(data.chatusr);
				$("#usernameText").val(data.usr);
				$("#passwordText").val(data.pwd);*/			 
		//  $("input[@name='contactType']:checked").trigger('click'); 
	     	        
	  /*  }, function (err) {
	    	
	         $("#contactList").text("No settings found!");
	        console.log("Error:  " + err);
	    });*/
		
/*Retrieval of User Data Ends Here*/
		
// Set initial values
chat.users = [];
chat.useMyDeck = false;
chat.myName='';

chat.settings = {};
chat.settings.predefined = {
	color: "black",
	fontFamily: "sans-serif",          
	fontSize: "100%"
};
chat.settings.opponent = {};
chat.settings.mine = {};
//we can't copy the whole object, because they would be tied together;
//possible TODO: add object cloning function (but right now this is enough)
chat.settings.opponent.color = chat.settings.mine.color = chat.settings.predefined.color;
chat.settings.opponent.fontFamily = chat.settings.mine.fontFamily = chat.settings.predefined.fontFamily;
chat.settings.opponent.fontSize = chat.settings.mine.fontSize = chat.settings.predefined.fontSize;

chat.invisible = false;


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
		user: chat.myName
	};
	if(engaged) ev.payload.status = chat.engaged;
	ev.dispatchWebinosEvent(callback);
};

function sendMsg(msgType, msgData) {
	var callback = {};
   	var ev = eventAPIToUse.createWebinosEvent();
   	ev.payload = {
		type: msgType,
		sender: chat.myName,
		receiver: chat.oName,
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


// this is a workaround. In the future, in multi-PZH scenarios, the plan is to obtain the userID from the platform.
// However, the option to change the userID obtained could be kept, keeping the following mechanism as well.
$(document).ready(function() {
	webinos.ServiceDiscovery.findServices(new ServiceType('http://webinos.org/api/events'),
		{
		onFound: function(service){
			console.log("Chat:events service found!!", service);
			eventAPIToUse = service;
			chat.unavailableNames = [];
			//chat.myName = webinos.messageHandler.getOwnId();
			//alert("Hi4" + chat.myName);
			 
			var listenerID = eventAPIToUse.addWebinosEventListener(function(event){
				if (event.payload.type === 'nameResponse') {
					chat.unavailableNames.push(event.payload.user);
				}
			});

			sendStatus('nameQuery');

			setTimeout(function() {nameInput(listenerID)}, 3000); //TODO check why there's a timeout here
		}
	});

	//rip out of dom elements, that we will frequently use later
	chatElements.status = document.getElementById("status-text");
	chatElements.contButton = document.getElementById("cont-button");
	chatElements.onlineContacts = document.getElementById("onlineContacts");
	chatElements.liveInvitations = document.getElementById("liveInvitations");

	chatElements.home = document.getElementById("home");
	chatElements.app = document.getElementById("app");
	chatElements.settings = document.getElementById("sett");
	chatElements.password = document.getElementById("password");

	chatElements.homeScreenName = document.getElementById("myName2");
	chatElements.frontStatus = document.getElementById("frontStatus");

	chatElements.newElem = document.getElementById("newElem");
	chatElements.endElem = document.getElementById("endElem");
	chatElements.endButton = document.getElementById("endButton");
	chatElements.setButton = document.getElementById("setButton");

	chatElements.chat = document.getElementById("chat");
	chatElements.chatBox = document.getElementById("chatBox");
	chatElements.chatText = document.getElementById("chatText");
	chatElements.chatButton = document.getElementById("chatButton");
	chatElements.chatInput = document.getElementById("chatInput");
	chatElements.textButton = document.getElementById("textButton");

	//set initial onclick actions
	chatElements.textButton.onclick = function() {showTextChat();};
	chatElements.endButton.onclick = function() {confirmExitapp();};
	chatElements.setButton.onclick = function() {setSettings();};
	chatElements.chatButton.onclick = function() {sendChat();};

	chatElements.chatInput.onkeypress = function() {if (event.keyCode==13) sendChat()};

	document.getElementById("cancelsettings").onclick = function() {cancelSettings();};
	document.getElementById("savesettings").onclick = function() {saveSettings();};
});


window.onbeforeunload = function(){ //that's probably unreliable
   	sendStatus('logout');
   	sendStatus('appClosed');
};


function nameInput(listenerID) {
     
	/*chat.myName = prompt("please, insert your name");
	while (chat.myName === '' || chat.unavailableNames.indexOf(chat.myName) !== -1) {
		chat.myName = prompt("please insert a different name");
	}*/

//	eventAPIToUse.removeWebinosEventListener(listenerID);
chat.getSettings(function (data) {
		 		console.log("Settings!!!! ", data);
				chatElements.homeScreenName.innerHTML = "Your screen name: <b>"+data.chatusr+"</b>";
				chat.myName = data.chatusr;
				//alert("Hi2" + chat.myName);
                start();
                //alert("Hi3" + chat.myName);
	            setScreenName();

	    }, function (err) {

	         $("#contactList").text("No settings found!");
	        console.log("Error:  " + err);
	    });
	
	/*if (chat.myName !== null && chat.myName !== undefined && chat.myName !== '') {
		start();
		setScreenName();
	} else {
		alert('username is missing');
	}  */
};


// this is the former ready function, renamed to start and called from the current ready function
var start = function() {

	eventAPIToUse.addWebinosEventListener(function(event){
		//debug
		/*for(var i in chat.users) {
			console.log(chat.users[i]);
		}*/

		switch(event.payload.type){
		
		case 'nameQuery':
			sendStatus('nameResponse');
			break;

		case 'login':
			if (event.payload.user !== chat.myName){
				if(typeof chat.users[event.payload.user] === 'undefined' || chat.users[event.payload.user] === 'offline'){
					chat.users[event.payload.user] = event.addressing.source;
					if(userNotListed(event.payload.user)){
						addContact(event.payload.user);
					}
				}
				//if im not invisible i send the event online
				if(!chat.invisible) {
					sendStatus('online', true);
				}
			}
			break;

		case 'online':	
			if (event.payload.user !== chat.myName &&
					(typeof chat.users[event.payload.user] === 'undefined' || chat.users[event.payload.user] == 'offline')
			){ // Filter
				chat.users[event.payload.user] = event.addressing.source;

				//if the player status is not chat.engaged, i can invite him to play
				if(typeof event.payload.status == 'undefined' || event.payload.status == '') {
					addContact(event.payload.user);
				} else { //otherwise the UI shows that the player is currently chatting
					addContact(event.payload.user);
					setContactchatting(event.payload.user);
				}
			}
			break;

		case 'logout':
			chat.users[event.payload.user] = 'offline';

			if (chat.engaged != event.payload.user) {
				removeContact(event.payload.user);
			} else {
				//TODO check why it's like that, with a loop, instead of a remove
				chatElements.onlineContacts.innerHTML = '';
				for (var user in chat.users) {
					if (chat.users[user] !== 'offline') {
						addContact(user);
					}
				}
			}
			break;

		case 'appClosed':
				if(event.payload.user === chat.engaged) {
					setStatusMessage(chat.oName + " closed the app!");

					resetApp();

					//if i'm not invisible i send the event loging, showing my presence
					if(!chat.invisible) {
						sendStatus('login');
					}

					sendStatus('notchatting');

					setTimeout(appClosed,3000); //TODO why the timeout
				}
			break;

		case 'invite':
			if(event.payload.invitee === chat.myName && !invitationExists(user)) {
				addInvitation(event.payload.inviter);
			}
			break;

		case 'cancelInvite':
			if(event.payload.invitee === chat.myName) {
				removeInvitation(event.payload.inviter);
			}
			break;

		case 'acceptInvitation':
			if(event.payload.inviter === chat.myName) {
				chat.engaged = event.payload.invitee;
               // showTextChat();
				setappUI();
				showapp();

			//	sendStatus('chatting');
				// Enter Stage 3: Start the app.
			}
			break;

		case 'chatting':
			if(event.payload.user != chat.myName) {
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
			if(event.payload.user != chat.myName) {
				if (!userNotListed(event.payload.user)) {
					resetContact(event.payload.user);
				}
			}
			break;

		case 'sendDeckData':
			if(event.payload.receiver === chat.myName) {
				chat.cardData = JSON.parse(event.payload.data);
				appInit();
			}
			break;

		case 'chat':
			if(event.payload.receiver === chat.myName) {
				pasteChatMsg(event.payload.sender, event.payload.data);
				scrollDownChatBox();

				//indicates incoming chat messages
				if(chatElements.chat.style.display == "none" || chatElements.chat.style.display == "") { //TODO?
					chatElements.textButton.style.border = "3px solid red";
				}
			}
			break;

		case 'newapp':
			if(event.payload.receiver === chat.myName) {
				setStatusMessage(event.payload.sender+' wants to start a New chat', 'black');
				setContButton('newchat');
				appt.newappProposal = true;
			}
			break;

		case 'newappAccepted':
			if(event.payload.receiver === chat.myName) {
				newappAccepted(true);
			}
			break;

		case 'newappRefused':
			if(event.payload.receiver === chat.myName) {
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

	
	/*function getURLParameter(name) {
		return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
	}
	chat.myName = getURLParameter("user");*/
	if(!chat.invisible) {
		sendStatus('login');
	}
};


/* HTML-related functions */


function setScreenName() {
	chatElements.homeScreenName.innerHTML = "Your screen name: <b>"+chat.myName+"</b>";
    //alert("Hi" + chat.myName);
	chatElements.frontStatus.innerHTML = "Connected to webinos chat";
}

//2 "screens" per function should be sufficient, but more could be added
function showHome() {
	chatElements.home.style.display = 'block';
	chatElements.app.style.display = 'none';

	chatElements.homeScreenName.style.display = 'block';
}
function showapp() {
	chatElements.home.style.display = 'none';
	chatElements.app.style.display = 'block';

	//chatElements.homeScreenName.style.display = 'none';
}

function showSettings() {
	chatElements.app.style.display = 'none';
	chatElements.settings.style.display = 'block';
}
function hideSettings() {
	chatElements.app.style.display = 'block';
	chatElements.settings.style.display = 'none';
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
 /*  chatElements.opacityBack.style.display = "none";
   chatElements.popup.style.display = "none";
   chatElements.password.value = ''; */
}

function openPopup() {
  /* chatElements.opacityBack.style.display = "block";
   chatElements.popup.style.display = "table"; */
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

	chatElements.onlineContacts.appendChild(li);
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
		chatElements.onlineContacts.removeChild(licontact);
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
	label.appendChild(document.createTextNode(" Invites you for a Chat."));
	li.appendChild(label);

	var anch = document.createElement('a');
	anch.className = "button";
	anch.onclick = function() {acceptInvitation(user)};
	anch.appendChild(document.createTextNode("Accept"));
	li.appendChild(anch);

	chatElements.liveInvitations.appendChild(li);
}

function removeInvitation(user) {
	var invitation = document.getElementById("liInviter" + user);
	if(invitation) chatElements.liveInvitations.removeChild(invitation);
}

function setStatusMessage(msg, className, add) { //you can skip the third param and use wrapper below; if no className - reset/remove classes
	if(add) {
		chatElements.status.innerHTML += '<br>'+msg;
	} else {
		chatElements.status.innerHTML = msg;
	}
	if(className) {
		chatElements.status.className = className;
	} else {
		chatElements.status.removeAttribute("class");
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
	chatElements.contButton.innerHTML = content;
}

function showTextChat() {
   chatElements.chat.style.display = 'table-row';
   chatElements.textButton.onclick = function() { hideTextChat(); };
   chatElements.textButton.style.border = 'none';
}

function hideTextChat() {
   chatElements.chat.style.display = 'none';
   chatElements.textButton.onclick = function() { showTextChat(); };
}



//app UI
function setappUI(){

	showTextChat();

};

//sends user's chat message
function sendChat() {
	var msg = chatElements.chatInput.value;
	if(msg!='') {
		chatElements.chatInput.value = "";
		sendMsg('chat', msg);
		pasteChatMsg(chat.myName, msg);
		scrollDownChatBox();
	}
};

function pasteChatMsg(sender, msg) {
	var senderName,
		settings,
		pClass;
	if(sender == chat.myName) {
		senderName = 'Me';
		settings = chat.settings.mine;
		pClass = '';
	} else {
		senderName = sender;
		settings = chat.settings.opponent;
		pClass = ' class="opponentLine"';
	}

	chatElements.chatBox.innerHTML += '<p'+pClass+'><span style="font-size:'+settings.fontSize+';color:'+settings.color+'">'+senderName+': </span><span style="font-family:\''+settings.fontFamily+'\';font-size:'+settings.fontSize+';color:'+settings.color+'">' + msg + '</span></p>';
}

function scrollDownChatBox() {
	chatElements.chatBox.scrollTop = chatElements.chatBox.scrollHeight;
}

function setSettings() {

	showSettings();
};

function saveSettings() {
	mfc = document.getElementById("mcolor");
	chat.settings.mine.color = mfc.options[mfc.selectedIndex].value;
	mff = document.getElementById("mfamily");
	chat.settings.mine.fontFamily = mff.options[mff.selectedIndex].value;
	mfs = document.getElementById("msize");
	chat.settings.mine.fontSize = mfs.options[mfs.selectedIndex].value;

	ofc = document.getElementById("ocolor");
	chat.settings.opponent.color = ofc.options[ofc.selectedIndex].value;
	off = document.getElementById("ofamily");
	chat.settings.opponent.fontFamily = off.options[off.selectedIndex].value;
	ofs = document.getElementById("osize");
	chat.settings.opponent.fontSize = ofs.options[ofs.selectedIndex].value;

//apply
	chatElements.chatInput.style.color = chat.settings.mine.color;
	chatElements.chatInput.style.fontFamily = chat.settings.mine.fontFamily;
	chatElements.chatInput.style.fontSize = chat.settings.mine.fontSize;

	mst = document.getElementById("mstatus");
	chat.users[chat.myName] = mst.options[mst.selectedIndex].value;

	if(chat.users[chat.myName] == 'offline') {
		chat.invisible = true;
		sendStatus('logout', true);
	} else {
		chat.invisible = false;
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
	sendInvitation('invite', chat.myName, contactName);
/*	alert(displayName);
	alert(contactName);
if (displayName == contactName) {
   	sendInvitation('invite', chat.myName, contactName);
}
else {
    setStatusMessage('contact not in your List...');
}*/
	chat.useMyDeck = true;
	chat.oName = contactName;
}

function cancelInvitation(invitee){
	resetContact(invitee, true);

   	sendInvitation('cancelInvite', chat.myName, invitee);

	chat.useMyDeck = false;
	chat.oName = "";
}

function acceptInvitation(inviter){
	chat.oName = inviter;
	chat.useMyDeck = false;
	chat.engaged = inviter;

    // Enter Stage 3: Start the app.
	setappUI();
	showapp();

   	sendInvitation('acceptInvitation', inviter, chat.myName);

	sendStatus('chatting');
};

function confirmExitapp() {
	setStatusMessage('Are you sure you want to exit?', 'black');
    setContButton('exit');
};

function cancelExitapp() {
	setContButton('empty');
	if(chat.useMyDeck) {
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
	if(chat.useMyDeck) {
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

	// in order to not exit from the app but just from the app

	//location.reload();

	resetApp();
	appClosed();

	//if i'm not invisible i send the event login, showing my presence
	if(!chat.invisible) {
		sendStatus('login');
	}

};

function resetApp() {
	//var reset
	chat.users = [];
	chat.engaged = '';
	chat.useMyDeck = false;
	chat.oName = "";

	//reset cards and buttons
	switchUICard("1", "b", "");
	switchUICard("2", "b", "");
	setContButton('empty');
	chatElements.newElem.className = "button2";
	chatElements.endElem.className = "button2";

	//reset contacts
	chatElements.onlineContacts.innerHTML = '';
	chatElements.liveInvitations.innerHTML = '';

	//reset chat history
	chatElements.chatBox.innerHTML = '';
}

// End of file.
