//////////////////////////////////////////////////////////////////////////
// User Queue - managers user who want to dj
//////////////////////////////////////////////////////////////////////////
//
// Anything that has to do with users trying to get on deck, or managing
// users while they're on deck lives in here.
/* ----------------------------------------------------------------------
													Object Structures
-------------------------------------------------------------------------
	var user = {
		name: userName,
		id: userId
	}
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports
var globalNamespace = {};
(function (exports) {
	exports.createNewUserQueue = function( bot ) {
		newUserQueue = new UserQueue( bot );
		return newUserQueue;
	};
}(typeof exports === 'object' && exports || globalNamespace));


//////////////////////////////////////////////////////////////////////////
// Namespace (lol)
var SHOW_DEBUG_PRINTS = true;																		
var log = function( a ) { if(SHOW_DEBUG_PRINTS) console.log(a); };				// A log function we can turn off
var exists = function(a) { return typeof(a) == "undefined" ? false : true; };	// Check whether a variable exists
var dflt = function(a, b) { 													// Default a to b if a is undefined
	if( typeof(a) === "undefined" ){ 
		return b; 
	} else return a; 
};

var MAX_QUEUED_USERS = 10;

//////////////////////////////////////////////////////////////////////////
// Constructor
function UserQueue( bot ) {
	this.bot = bot;
	this.userQueue = [];
	this.enableQueue;
	
	var _this = this;
	this.bot.on( "speak", function( data ) {
		var user = {
			name: data.name,
			id: data.userid
		}
	
		if( data.text == "q" ) {
			_this.speakQueue();
		} else if( data.text == "+q" ) {
			_this.addUser( user );
		} else if( data.text == "-q" ) {
			_this.removeUser( user );
		}
	}); // end on speak
	
	this.bot.on( "rem_dj", function( data ) {
		if( _this.userQueue.length == 0 ) return;	
		
		getNumOpenSlots( _this.bot, function( numSlots ) {			
			if( numSlots == 1 ) {
				if( typeof(_this.userQueue[0]) == "undefined" ) return;
				_this.bot.speak( "Step up @" + _this.userQueue[0].name ); 
				var nextDjId = _this.userQueue[0].id;
				
				setTimeout( function() {
					if( typeof(_this.userQueue[0]) == "undefined" ) return;
					if( _this.userQueue[0].id == nextDjId ) {
						_this.userQueue.splice(0, 1);
						if( _this.userQueue.length > 0 ) {
							_this.bot.speak( "Step up @" + _this.userQueue[0].name ); 
						}
					}
				}, 60000);
			}
		});
	});
	
	this.bot.on( "add_dj", function( data ) {
		if( _this.userQueue.length == 0 ) return;
	
		var user = {
			name: data.user[0].name,
			id: data.user[0].userid
		};
		
		console.log( data.user );
		
		getNumOpenSlots( _this.bot, function( numSlots ) {
			if( numSlots == 0 ) {
				// Make sure this user was supposed to get up
				if( user.id == _this.userQueue[0].id ) {
					_this.userQueue.splice(0, 1);
				} else {
					_this.bot.remDj( user.id );
					_this.bot.speak( "Wait your turn @" + user.name );
				}
			} else {
				if( user.id == _this.userQueue[0].id ) {
					_this.userQueue.splice(0, 1);
				}
			}
		});
	});
	
	this.bot.on( "deregistered", function( data ) {
		if( _this.userQueue.length == 0 ) return;
	
		var user = {
			name: data.user[0].name,
			id: data.user[0].userid
		};
		
		for( var iUser=0; iUser<_this.userQueue.length; ++iUser ) {
			if( user.id == _this.userQueue[iUser].id ) {
				_this.userQueue.splice(iUser, 1);
			}
		}
	});
	
} // end UserQueue()


//////////////////////////////////////////////////////////////////////////
// Adds a user to the queue 
UserQueue.prototype.addUser = function( user ) {
	var _this = this;

	getDjs( this.bot, function( djs ) {
		var userIndex = -1;
		for( var iUser=0; iUser<djs.length; ++iUser ) {
			if( user.id == djs[iUser] )
				userIndex = iUser;
		}
		
		if( userIndex >= 0 ) {
			_this.bot.speak( "You're already djing @" + user.name );
			return;
		} else {
			if( _this.userQueue.length < MAX_QUEUED_USERS ) {
				_this.userQueue.push( user );
				_this.bot.speak( "Added " + user.name + " to the queue" );
			} else {
				_this.bot.speak( "Sorry " + user.name + ", we already have " + MAX_QUEUED_USERS + " in the queue" );
			}
		} 
	}); // end getDjs
} // end UserQueue.addUser()


//////////////////////////////////////////////////////////////////////////
// Remove a user from the queue 
UserQueue.prototype.removeUser = function( user ) {
	// Make sure this users is actually in the list
	var userIndex = -1;
	for( var iUser=0; iUser<this.userQueue.length; ++iUser ) {
		if( this.userQueue[iUser].id == user.id ) {
			userIndex = iUser;
			break;
		}
	}
	
	if( userIndex >= 0 ) {
		this.bot.speak("Removing " + this.userQueue[userIndex].name + " from the queue" );
		this.userQueue.splice(userIndex, 1);
	} else {
		this.bot.speak("You weren't in the queue " + user.name + ", or maybe I'm just broken... :(" );
	}
} // end UserQueue.removeUser()


//////////////////////////////////////////////////////////////////////////
// Returns the list of queued users
UserQueue.prototype.getQueuedUsers = function() {
	return this.userQueue;
} // end UserQueue.getQueuedUsers()


//////////////////////////////////////////////////////////////////////////
// Adds a user to the queue 
UserQueue.prototype.speakQueue = function() {
	if( this.userQueue.length == 0 ) {
		this.bot.speak( "No users in the queue" );
		return;
	}

	var outputString = "",
		queue = this.getQueuedUsers();
		
	outputString += "Queue: ";
	for( var iUser=0; iUser < this.userQueue.length; ++iUser ) {
		var userNum = iUser + 1;
		outputString += userNum + ") " + this.userQueue[iUser].name + " ";
	}	
	
	this.bot.speak( outputString );
} // end UserQueue.speakQueue()


function getNumOpenSlots( bot, callback ) {
	bot.roomInfo( function( info ) { 
		var max = info.room.metadata.max_djs,
			count = info.room.metadata.djcount;
		
		callback( max - count );
	});
} // end getNumOpenSlots()


function getDjs( bot, callback ) {
	bot.roomInfo( function( info ) { 		
		callback( info.room.metadata.djs );
	});
} // end getDjs()