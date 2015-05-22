Groups = new Mongo.Collection("groups");

Meteor.startup(function () {
	Meteor.publish('userScores', function () {
		return Meteor.users.find({}, {profile: {displayName: 1, subs: 1, rejs: 1, accs: 1, wds: 1, score: 1, groupId: 1}});
	});

	/// Email Verification nonsense cribbed from gentlenode.com
	Accounts.emailTemplates.from = 'Sink or Submit <no-reply@meteor.com>';

	Accounts.emailTemplates.siteName = 'Sink or Submit';
	
	Accounts.emailTemplates.verifyEmail.subject = function (user) {
		return 'Confirm Your Email Address';
	};
	
	Accounts.emailTemplates.verifyEmail.text = function (user, url) {
		return "Copy and paste the following link into your browser's address bar to verify your email address for Sink or Submit: " + url;
	};

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
	user.groups = [];

	if (options.profile)
		user.profile = options.profile;

	Meteor.setTimeout(function () {
		Accounts.sendVerificationEmail(user._id);
	}, 2 * 1000);

	return user;
});

Accounts.validateLoginAttempt(function (attempt) {
	if (attempt.user && attempt.user.emails && !attempt.user.emails[0].verified ) {
		console.log('email not verified');

		return false;
	}

	return true;
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
	  	groupAdmin: 1,
		groups: 1}
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

	groupStrap: function () {
		// bootstrap users who don't have the groups[] attribute in their user profile yet
		if (!Meteor.user().groups) {
			Meteor.users.update(Meteor.userId(), {$push: { groups: {
				gid: Meteor.user().groupId,
				description: Groups.findOne(Meteor.user().groupId).groupDescription,
				adminOfGroup: Meteor.user().groupAdmin}}
			});
		}
	},

	joinGroup: function (group, admin, secret) {
		// confirms that secret provided matches with group secret
		if (secret === Groups.findOne({groupId: group}, {fields: {secret: 1}}).secret) {
			// takes a group's shortname and converts it to group's _id
			var id = Groups.findOne({groupId: group}, {fields: {_id: 1}})._id;
			Meteor.users.update(Meteor.userId(), {$set: {groupId: id}});
			Meteor.users.update(Meteor.userId(), {$push: { groups: {
				gid: id,
				description: Groups.findOne(id).groupDescription,
				adminOfGroup: admin}}
			});
			Meteor.call("memberNum", id);
			Meteor.call("makeAdmin", Meteor.userId(), admin);
		}
	},

	switchGroup: function (id, gid) {
		// Switch which group the user is actively viewing
		var group = Meteor.users.findOne(id).groups.filter(function (obj) {
			return obj.gid === gid
		});
		Meteor.users.update(id, {$set: {groupId: group[0].gid, groupAdmin: group[0].adminOfGroup}});
	},

	memberNum: function (gid) {
		var number = Meteor.users.find({groupId: gid}).fetch().length;
//		console.log("This group now has " + number + " members.");
		Groups.update(gid, {$set: {members: number}});
	},

	removeGroup: function (gid) {
		if (Groups.findOne(gid).members === 0) {
//			console.log("Removing group " + gid);
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
//		console.log("Group id: " + gid);
		if (admin) {
//			console.log("Adding admin");
			Meteor.users.update(id, {$set: {groupAdmin: admin}});
			Meteor.users.update({"_id": id, "groups.gid": gid}, {$set: {"groups.$.adminOfGroup": admin}});
			var num = Meteor.users.find({groupId: gid, groupAdmin: true}).fetch().length;
//			console.log("Number of admins in group: " + num);
			Groups.update(gid, {$set: {admins: num}});
//			console.log("Group.find.admins: " + Groups.findOne(Meteor.users.findOne(id).groupId).admins);
		} else {
//			console.log("Setting admin status to " + admin);
			Meteor.users.update(id, {$set: {groupAdmin: admin}});
			Meteor.users.update({"_id": id, "groups.gid": gid}, {$set: {"groups.$.adminOfGroup": admin}});
//			console.log("Calculating number of admins...");
			var num = Meteor.users.find({groupId: gid, groupAdmin: true}).fetch().length;
//			console.log("Number of admins in group, according to users.find.length method: " + num);
			Groups.update(gid, {$set: {admins: num}});
//			console.log("Group.find.admins: " + Groups.findOne(Meteor.users.findOne(id).groupId).admins);
		}
//		console.log("Final number of admins: " + num);
	},

	adminNum: function (gid, number) {
		Groups.update(gid, {$set: {admins: number}});
	},

	leaveGroup: function (id) {
		// If user is in more than one group, set their groupId (id of their active group) to the gid of groups[0]
		// and switch their active group, otherwise, set groupId to null, then pull group identified by gid from
		// the user's groups[] array.
		var gid = Meteor.users.findOne(id).groupId;
//		console.log("User with id " + id + " leaving group");
		Meteor.call("makeAdmin", id, false);
		if (Meteor.users.findOne(id).groups.length < 2) {
			Meteor.users.update(id, {$set: {groupId: null}});
		} else {
			Meteor.users.update(id, {$set: {groupId: Meteor.users.findOne(id).groups[0].gid, groupAdmin: Meteor.users.findOne(id).groups[0].adminOfGroup}});
			Meteor.call("switchGroup", id, gid);
		}
		Meteor.users.update(id, {$pull: {groups: {gid: gid}}}, {multi: true});
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
