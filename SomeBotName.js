// Max Wax's 'master'
var USER_TO_FOLLOW = "4e14a021a3f75102d3013beb";

var MAX_QUEUE_LENGTH = 8;
var maxSongs = 3;

var userQueue = [];

var Bot    = require('ttapi');
var bot = new Bot("AUTH", "USERID", "ROOMID");

console.log( "Created the bot" );

var queue = require("./UserQueue").createNewUserQueue( bot );
var djManager = require("./DJManager").createNewDJManager( bot, {} );
var usersList = { };

// Add everyone in the users list.
bot.on('roomChanged',  function (data) {

	console.log( "Joined a room" );
	bot.speak("Where am I?");

	usersList = { };
	for (var i=0; i<data.users.length; i++) {
		var user = data.users[i];
		user.lastActivity = Date.now();
		usersList[user.userid] = user;
	}
});


bot.on('speak', function (data) {	
	if( data.text.indexOf("--" == 0) ) {
		handleCommand( data.text.substring(3), true, data.name, data.userid );
	}	
});


function handleCommand( command, isMod, userName, userId ) {
	command = command.toLowerCase();

	if( command == "up" ) {
		bot.addDj();
	} else if( command == "down" ) {
		bot.remDj();
	} else if( command == "skip" ) {
		bot.skip();
	} else if( command == "bonus" ) {
		bot.vote("up");
	}
}

function addUserToQueue( userName, userId ) {
	var queuedUser = {
		name: userName,
		id: userId
	}

	if( userQueue.length < MAX_QUEUE_LENGTH ) {
		userQueue.push( queuedUser );
	} else {
		bot.speak("Sorry " + userName + ", the queue already has " + MAX_QUEUE_LENGTH + " users on it. No room left." );
		return;
	}
}