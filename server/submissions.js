Groups = new Mongo.Collection("groups");

Meteor.startup(function () {
	Meteor.publish('userScores', function () {
		return Meteor.users.find({}, {profile: {subs: 1, rejs: 1, accs: 1, wds: 1, score: 1, groupId: 1}});
	});

/*	Meteor.publish('groups', function () {
		return Groups.find(Meteor.user().groupId, {fields: {groupId: 1, groupDescription: 1}});
	});*/
});

Accounts.onCreateUser(function(options, user) {
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
		groupDescription: 1}
	});
});

Meteor.methods({
	joinGroup: function (group, admin) {
		// takes a group's shortname and converts it to group's _id
		var id = Groups.findOne({groupId: group}, {fields: {_id: 1}})._id;
		console.log(id);
		Meteor.users.update(Meteor.userId(), {$set: {groupId: id}});
		if (admin)
			Meteor.users.update(Meteor.userId(), {$set: {groupAdmin: admin}});
	},

	leaveGroup: function () {
		Meteor.users.update(Meteor.userId(), {$set: {groupId: null}});
	},
	  
	createGroup: function (groupId, groupDescription, secret) {
		if (! Meteor.userId())
			throw new Meteor.Error("not-authorized");

		Groups.insert({
			groupId: groupId,
			groupDescription: groupDescription,
			secret: secret
		});
		
		console.log(groupId);
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
