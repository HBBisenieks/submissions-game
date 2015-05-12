Groups = new Mongo.Collection("groups");

Meteor.startup(function () {
	Meteor.publish('userScores', function () {
		return Meteor.users.find({}, {profile: {displayName: 1, subs: 1, rejs: 1, accs: 1, wds: 1, score: 1, groupId: 1}});
	});

/*	Meteor.publish('groups', function () {
		return Groups.find(Meteor.user().groupId, {fields: {groupId: 1, groupDescription: 1}});
	});*/
});

Accounts.onCreateUser(function(options, user) {
	user.displayName = user.username;
	user.subs = 0;
	user.rejs = 0;
	user.accs = 0;
	user.wds = 0;
	user.score = 0;
	user.prevScore = 0;
	user.groupId = null;
  	user.groupAdmin = false;

	if (options.profile)
		user.profile = options.profile;

	return user;
});

Meteor.publish('userData', function() {
	if (!this.userId) return null;
	return Meteor.users.find(this.userId, {fields: {
		displayName: 1,
		subs: 1,
		rejs: 1,
		accs: 1,
		wds: 1,
		score: 1,
	  	groupId: 1,
	  	groupAdmin: 1}
	});
});

Meteor.publish("groups", function () {
	return Groups.find({}, {fields: {
		groupId: 1,
		groupDescription: 1,
		members: 1,
		admins: 1}
	});
});

Meteor.methods({
	setDisplayName: function (name) {
		Meteor.users.update(Meteor.userId(), {$set: {displayName: name}});
	},

	joinGroup: function (group, admin, secret) {
		// confirms that secret provided matches with group secret
		if (secret === Groups.findOne({groupId: group}, {fields: {secret: 1}}).secret) {
			// takes a group's shortname and converts it to group's _id
			var id = Groups.findOne({groupId: group}, {fields: {_id: 1}})._id;
			Meteor.users.update(Meteor.userId(), {$set: {groupId: id}});
			Meteor.call("memberNum", id);
			if (admin)
				Meteor.call("makeAdmin", Meteor.userId(), admin);
		}
	},

	memberNum: function (gid) {
		var number = Meteor.users.find({groupId: gid}).fetch().length;
		console.log("This group now has " + number + " members.");
		Groups.update(gid, {$set: {members: number}});
	},

	removeGroup: function (gid) {
		if (Groups.findOne(gid).members === 0) {
			console.log("Removing group " + gid);
			Groups.remove(gid);
		}
	},

	changeGroupName: function (name) {
		Groups.update(Meteor.user().groupId, {$set: {groupDescription: name}});
	},

	changeGroupSecret: function (oldSecret, newSecret) {
		if (Groups.findOne(Meteor.user().groupId).secret === oldSecret)
			Groups.update(Meteor.user().groupId, {$set: {secret: newSecret}});
	},

	makeAdmin: function (id, admin) {
		// Below comment no longer true, but I'm keeping it there so that this stupid function will
		// remember what it's done.
		//
		// THIS PIECE OF SHIT STILL WON'T GIVE ACCURATE NUMBERS ON GROUP ADMINS ON THE FIRST TRY
		// AND I HATE ITS GUTS
		var gid = Meteor.users.findOne(id).groupId;
		console.log("Group id: " + gid);
		if (admin) {
			console.log("Adding admin");
			Meteor.users.update(id, {$set: {groupAdmin: admin}});
			var num = Meteor.users.find({groupId: gid, groupAdmin: true}).fetch().length;
			console.log("Number of admins in group: " + num);
			Groups.update(gid, {$set: {admins: num}});
			console.log("Group.find.admins: " + Groups.findOne(Meteor.users.findOne(id).groupId).admins);
		} else {
			console.log("Setting admin status to " + admin);
			Meteor.users.update(id, {$set: {groupAdmin: admin}});
			console.log("Calculating number of admins...");
			var num = Meteor.users.find({groupId: gid, groupAdmin: true}).fetch().length;
			console.log("Number of admins in group, according to users.find.length method: " + num);
			Groups.update(gid, {$set: {admins: num}});
			console.log("Group.find.admins: " + Groups.findOne(Meteor.users.findOne(id).groupId).admins);
		}
		console.log("Final number of admins: " + num);
	},

	adminNum: function (gid, number) {
		Groups.update(gid, {$set: {admins: number}});
	},

	leaveGroup: function (id) {
		// Set user id's group to null and strip admin privileges
		var gid = Meteor.users.findOne(id).groupId;
		console.log("User with id " + id + " leaving group");
		Meteor.call("makeAdmin", id, false);
		Meteor.users.update(id, {$set: {groupId: null}});
		Meteor.call("memberNum", gid);
	},
	  
	createGroup: function (groupId, groupDescription, secret) {
		if (! Meteor.userId())
			throw new Meteor.Error("not-authorized");

		Groups.insert({
			groupId: groupId,
			groupDescription: groupDescription,
			secret: secret
		});
	},
	
  	incSubs: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {subs: 1}});
		Meteor.users.update(Meteor.userId(), {$inc: {score: 1}});
  	},

  	decSubs: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {subs: -1}});
		Meteor.users.update(Meteor.userId(), {$inc: {score: -1}});
  	},

  	incRejs: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {rejs: 1}});
		Meteor.users.update(Meteor.userId(), {$inc: {score: 1}});
  	},

  	decRejs: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {rejs: -1}});
		Meteor.users.update(Meteor.userId(), {$inc: {score: -1}});
  	},

  	incAccs: function () {
		// Buffers user's previous score in case of accidental acceptance log
		var score = Meteor.user().score;
  		Meteor.users.update(Meteor.userId(), {$inc: {accs: 1}});
		Meteor.users.update(Meteor.userId(), {$set: {prevScore: score}});
		Meteor.users.update(Meteor.userId(), {$set: {score: 0}});
  	},

  	decAccs: function () {
		// Restores user's score in case of accidental acceptance log
		var prevScore = Meteor.user().prevScore;
  		Meteor.users.update(Meteor.userId(), {$inc: {accs: -1}});
		Meteor.users.update(Meteor.userId(), {$set: {score: prevScore}});
  	},

  	incWds: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {wds: 1}});
  	},

  	decWds: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {wds: -1}});
  	},

	setGroup: function (group) {
		Meteor.users.update(Meteor.user(), {$set: {groupId: group}});
	}

});
