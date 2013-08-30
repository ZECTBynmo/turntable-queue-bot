//////////////////////////////////////////////////////////////////////////
// DJ Manager - managers user djing
//////////////////////////////////////////////////////////////////////////
//
/* ----------------------------------------------------------------------
													Object Structures
-------------------------------------------------------------------------
	var playcount = {
		id: userId,
		playcount: count
	}
*/
//////////////////////////////////////////////////////////////////////////
// Node.js Exports
var globalNamespace = {};
(function (exports) {
	exports.createNewDJManager = function( bot, masters ) {
		newDJManager = new DJManager( bot, masters );
		return newDJManager;
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

var MAX_PLAYS = 3;

//////////////////////////////////////////////////////////////////////////
// Constructor
function DJManager( bot, masters ) {
	this.bot = bot;
	this.masters = masters;
	this.djIds = [];
	this.VIPs = [];
	
	var _this = this;
	this.bot.on( "speak", function( data ) {
		var user = {
			name: data.name,
			id: data.userid
		}		
		
		if( !isMaster(user.id, _this.masters) ) {
			console.log( "Not a mod" );
			console.log( user );
			console.log( _this.masters );
			return;
		}
	
		if( data.text == "+vip" ) {
			_this.speakQueue();
		}
	}); // end on speak
	
	this.bot.on( "rem_dj", function( data ) {
		getDjs( bot, function(djs) {
			for( var iDj in _this.djIds ) {
				if( iDj.id == data.user.userid ) {
					_this.djIds.splice(iDj, 1);
				}				
			}
			
			for( var iUser=0; iUser<_this.VIPs.length; ++iUser ) {
				if( data.user.userid == _this.VIPs[iUser] )
					_this.VIPs.splice(iUser, 1);
			}
		});
	});
	
	this.bot.on( "add_dj", function( data ) {
		var playcount = {
			id: data.user.userid,
			playcount: 0
		}
		
		getDjs( bot, function(djs) {
			var userIndex = getDjIndex( data.user.userid, _this.djIds );
			_this.djIds[data.user.userid] = playcount;
		});
	});
	
	/*	
	this.bot.on( "newsong", function( data ) {
		var userIndex = getDjIndex( data.room.metadata.userid, _this.djIds );
		//this.djIds[userIndex].playcount += 1;
		
		// Remove this dj if they've gone over their limit
		if( !isMember(data.room.metadata.userid, this.VIPs) && this.djIds[data.room.metadata.userid].playcount >= MAX_PLAYS ) {
			bot.speak("Thanks @" + data.room.metadata.userid );
			bot.remDj( data.room.metadata.userid );
		}
	});
	*/
} // end DJManager()


//////////////////////////////////////////////////////////////////////////
// Adds a vip to the list
DJManager.prototype.addVIP = function( userName ) {
	console.log( "Adding " + userName + " to the VIP list" );

	bot.roomInfo( function( info ) { 	
		for( var iUser=0; iUser<data.users.length; ++iUser ) {
			if( data.users[iUser].name == userName )
				this.VIPs.push( data.users[iUser].userid );
		}
	});
} // end DJManager..addVIP()


function getDjs( bot, callback ) {
	bot.roomInfo( function( info ) { 		
		callback( info.room.metadata.djs );
	});
} // end getDjs()


// Returns whether the userid is within group
function isMember( userid, group ) {
	var isAMember = false;
	for( var iUser=0; iUser<group.length; ++iUser ) {
		if( group[iUser] == userid )
			isAMember = true;
	}
	
	return isAMember;
}

function isMaster( userid, masters ) {
	var isAMaster = false;
	for( var iMaster in masters ) {
		if( masters[iMaster] == userid ) {
			isAMaster = true;
		}				
	}
	
	return isAMaster;
}

function getDjIndex( userid, userList ) {
	var userIndex = -1;
	for( var iUser=0; iUser<userList.length; ++iUser ) {
		if( userList == userid )
			userIndex = iUser;			
	}
	
	return userIndex;
}