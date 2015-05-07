// Client code
Meteor.subscribe('groups');
Groups = new Mongo.Collection("groups");

Template.body.helpers({
	userScore: function () {
		// return user's score
		return Meteor.user().score;
	},

	isAdmin: function () {
		return Meteor.user().groupAdmin;
	}
});

Template.leaderboard.helpers({
	writer: function () {
		// return all user's attributes for leaderboard
		return Meteor.users.find({groupId: Meteor.user().groupId}, {fields: {username: 1, subs: 1, rejs: 1, accs: 1, wds: 1, score: 1}, sort: {score: -1}});
	},

	isAdmin: function (writer) {
		if (Meteor.users.findOne({username: writer}).groupAdmin)
			return "*";
		return "";
	}
});

Template.groupAdmin.helpers({
	writer: function () {
		// Return list of users, excluding current user, for dropdown menu
		return Meteor.users.find({groupId: Meteor.user().groupId, username: {$ne: Meteor.user().username}}, {fields: {username: 1, groupAdmin: 1}, sort: {username: 1}});
	}
});

Template.groupAdmin.events({
	'change .members': function (event, template) {
		// Set Session variable id to _id attribute of user to be manipulated by admin
		var name = template.find('.members').value;
		var id = Meteor.users.findOne({username: name})._id;
		// log for debugging
		console.log(name);
		console.log(id);
		Session.set('manipId', id);
		Session.set('manipName', name);
	},

	'click .makeAdmin': function () {
		if (confirm("Make " + Session.get('manipName') + " a group admin?"))
			Meteor.call("makeAdmin", Session.get('manipId'), true);
	},

	'click .kick': function () {
		if (confirm("Remove " + Session.get('manipName') + " from group? User may re-join group unless group secret is changed."))
			Meteor.call("leaveGroup", Session.get('manipId'));
	}
});

Template.userGroup.helpers({
	inGroup: function () {
		// Return true if user is in a group
		if (Meteor.user().groupId === null) {
			return false;
		}
		return true;
	},

	groupName: function () {
		// Returns group name
		return Groups.findOne(Meteor.user().groupId, {fields: {groupDescription: 1}});
	},
});

Template.joinGroup.events({
	'click input[type=radio]': function (event) {
		var task = $('input[name=group-select]:checked').val();
		Session.set('action', task);
	},

	'submit .joinGroup': function (event) {
		var group = event.target.groupName.value;
		var secret = event.target.groupSecret.value;
		var enc = CryptoJS.MD5(secret).toString();
		Meteor.call("joinGroup", group, false, enc);
	},

	'submit .createGroup': function (event) {
		var group = event.target.groupName.value;
		var desc = event.target.groupDescription.value;
		var secret = event.target.groupSecret.value;
		var conf = event.target.secretConfirm.value;

		if (! Groups.findOne({groupId: group})) {
			if (conf === secret) {
				var enc = CryptoJS.MD5(secret).toString();
				Meteor.call("createGroup", group, desc, enc);
				Meteor.call("joinGroup", group, true, enc);
			}
		}
	}
});

Template.joinGroup.helpers({
	join: function () {
		if (Session.equals('action', "join"))
			return true;
		return false;
	},

	create: function () {
		if (Session.equals('action', "create"))
			return true;
		return false;
	}
});

Template.leaveGroup.events({
	'click .leave': function () {
		if (confirm("Are you sure you want to leave your group?") && confirm("Are you really sure?")) {
			Meteor.call("leaveGroup", Meteor.userId());
		}
	}
});

Template.leaveGroup.helpers({
	inGroup: function () {
		// Return true if user is in a group
		if (Meteor.user().groupId === null) {
			return false;
		}
		return true;
	}
});

Template.trophy.helpers({
	leading: function () {
		// Return true if current user has highest score
		// tropy template displays trophy for user with highest score
		// 
		// Will display trophy to multiple users who share high score
		// even though leaderboard will still rank one above others
		if (Meteor.userId() === Meteor.users.findOne({groupId: Meteor.user().groupId}, {fields: {_id: 1}, sort: {score: -1}})._id) {
			return true;
		}
		return false;
	}
});

Template.userStats.helpers({
	// helpers to access user stats
	userSubs: function () {
		var id = Meteor.user().username;
		return Meteor.user().subs;
	},
	userRejections: function () {
		return Meteor.user().rejs;
	},
	userAccept: function () {
		return Meteor.user().accs;
	},
	userWithdraw: function () {
		return Meteor.user().wds;
	},
  	userScore: function () {
		return Meteor.user().score;
	}
});

Template.statBar.helpers({
	rejWidth: function () {
		var total = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		return ((Meteor.user().rejs / total) * 100);
	},
	accWidth: function () {
		var total = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		return ((Meteor.user().accs / total) * 100);
	},
	wdWidth: function () {
		var total = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		return ((Meteor.user().wds / total) * 100);
	}
});

Template.statUpdate.events({
	'click .subPlus': function () {
		// increment user submission
		Meteor.call("incSubs");
	},
	'click .subMinus': function () {
		// Only decrement submissions if it would not take submission number below total number of responses
		var responses = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		if (Meteor.user().subs > responses) {
			if (Meteor.user().subs > 0) {
			// Confirm before removing submission
				if (confirm('Remove submission?')) {
					Meteor.call("decSubs");
				}
			}
		}
	},
	'click .rejPlus': function () {
		// increment user rejection only if sum of responses is less than number of submissions
		var responses = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		if (responses < Meteor.user().subs) {
			Meteor.call("incRejs");
		}
	},
	'click .rejMinus': function () {
		if (Meteor.user().rejs > 0) {
			// Confirm before removing rejection
			if (confirm('Remove rejection?')) {
		  		Meteor.call("decRejs");
		 	}
		}
	},
	'click .accPlus': function () {
		// increment user acceptance only if sum of responses is less than number of submissions
		var responses = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		if (responses < Meteor.user().subs) {
			Meteor.call("incAccs");
		}
	},
	'click .accMinus': function () {
		if (Meteor.user().accs > 0) {
			// Confirm before removing acceptance
			if (confirm('Remove acceptance?')) {
				Meteor.call("decAccs");
			}
		}
	},
	'click .wdPlus': function () {
		// increment user withdrawals only if sum of responses is less than number of submissions
		var responses = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		if (responses < Meteor.user().subs) {
			Meteor.call("incWds");
		}
	},
	'click .wdMinus': function () {
		if (Meteor.user().wds > 0) {
			// Confirm before removing withdrawal
			if (confirm('Remove withdrawal?')) {
				Meteor.call("decWds");
			}
		}
	}
});

Accounts.ui.config({
	passwordSignupFields: "USERNAME_ONLY"
});

Deps.autorun(function() {
	Meteor.subscribe('userData');
  	Meteor.subscribe('userScores');
});
