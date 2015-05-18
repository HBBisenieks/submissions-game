// Client code
Meteor.subscribe('groups');
Groups = new Mongo.Collection("groups");

Template.body.created = function () {
	if (Accounts._verifyEmailToken) {
		Accounts.verifyEmail(Accounts._verifyEmailToken, function (err) {
			if (err != null) {
				if (err.message = 'Verify email link expired [403]') {
					console.log('Sorry, this verification link has expired');
				}
			} else {
				console.log('Thank you! Your email address has been verified.');
			}
		});
	}
};

Template.body.helpers({
	userScore: function () {
		// return user's score
		return Meteor.user().score;
	}
});

Template.controls.helpers({
	isAdmin: function () {
		return Meteor.user().groupAdmin;
	}
});

Template.leaderboard.helpers({
	writer: function () {
		// return all user's attributes for leaderboard
		return Meteor.users.find({groups: {$elemMatch: {gid:Meteor.user().groupId}}}, {fields: {username: 1, displayName: 1, subs: 1, rejs: 1, accs: 1, wds: 1, score: 1}, sort: {score: -1}});
	},

	isAdmin: function (writer) {
		if (Meteor.users.findOne({username: writer}).groupAdmin)
			return "*";
		return "";
	}
});

Template.showAdmin.events({
	'click .toggle-admin': function (event) {
		Session.set("showAdmin", event.target.checked);
	}
});

Template.changeDisplayName.helpers({
	change: function () {
		return (Session.get("showChange"));
	}
});

Template.changeDisplayName.events({
	'click .toggle-change': function (event) {
		Session.set("showChange", event.target.checked);
	},

	'submit .newName': function (event) {
		var name = event.target.name.value;
		Meteor.call("setDisplayName", name);
	}
});


Template.groupAdmin.helpers({
	show: function (){
		return (Session.get("showAdmin"));
	},

	writer: function () {
		// Return list of users, excluding current user, for dropdown menu
		return Meteor.users.find({groups: {$elemMatch: {gid:Meteor.user().groupId}}, username: {$ne: Meteor.user().username}}, {fields: {username: 1, groupAdmin: 1}, sort: {username: 1}});
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

Template.groupSelect.helpers({
	group: function () {
		Meteor.call("groupStrap"); // Call to bootstrap users created before multi-group feature added
		return Meteor.user().groups;
	}
});

Template.groupSelect.events({
	'change .groups': function (event, template) {
		var gid = template.find('.groups').value;
		Meteor.call("switchGroup", gid);
	}
});

Template.changeName.events({
	'submit .groupName': function (event) {
		var name = event.target.name.value;
		Meteor.call("changeGroupName", name);
	}
});

Template.changeSecret.events({
	'submit .groupSecret': function (event) {
		var oldSecret = event.target.old.value;
		var encOld = CryptoJS.MD5(oldSecret).toString();
		var newSecret = event.target.new.value;
		var confSecret = event.target.confirm.value;

		if (newSecret === confSecret) {
			var encNew = CryptoJS.MD5(newSecret).toString();
			Meteor.call("changeGroupSecret", encOld, encNew);
		}
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

Template.groupAction.events({
	'click input[type=radio]': function (event) {
		var task = $('input[name=group-select]:checked').val();
		Session.set('action', task);
	}
});

Template.joinGroup.events({
	'submit .joinGroup': function (event) {
		var group = event.target.groupName.value;
		var secret = event.target.groupSecret.value;
		var enc = CryptoJS.MD5(secret).toString();
		Meteor.call("joinGroup", group, false, enc);
	}
});

Template.newGroup.events({
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

Template.groupAction.helpers({
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
		console.log(Meteor.user().groupAdmin);
		if (Groups.findOne(Meteor.user().groupId).members === 1) {
			if (confirm("You are the last member of this group. Leaving this group will result in its deletion. Continue?")) {
				var gid = Meteor.user().groupId;
				Meteor.call("leaveGroup", Meteor.userId());
				Meteor.call("removeGroup", gid);
			}
		} else if ((Meteor.user().groupAdmin === true) && (Groups.findOne(Meteor.user().groupId).admins < 2)) {
			alert("You are the only admin for this group. Please grant admin rights to another member before leaving the group.");
		} else {
			if (confirm("Are you sure you want to leave your group?") && confirm("Are you really sure?")) {
				Meteor.call("leaveGroup", Meteor.userId());
			}
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
		if (Meteor.userId() === Meteor.users.findOne({groups: {$elemMatch: {gid: Meteor.user().groupId}}}, {fields: {_id: 1}, sort: {score: -1}})._id) {
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

/// Trying chart.js but so far not working

Template.statBar.rendered = function () {
	drawChart();
};

function drawChart() {
	var responseChart = document.getElementById("responseChart").getContext("2d");
	var responseData = [
	{
		value: Meteor.user().subs,
		color: "#666666",
		highlight: "#999999",
		label: "Submissions"
	},
	{
		value: Meteor.user().rejs,
		color: "#ff0000",
		highlight: "#cc0000",
		label: "Rejections"
	},
	{
		value: Meteor.user().accs,
		color: "#00ff00",
		highlight: "#00cc00",
		label: "Acceptances"
	},
	{
		value: Meteor.user().wds,
		color: "#0000ff",
		highlight: "#0000cc",
		label: "Withdrawals"
	}
	];

	var responsePie = new Chart(responseChart).Pie(responseData, {
		animateScale: true
	});
};

Template.statBar.helpers({
	rejWidth: function () {
		var total = Meteor.user().rejs + Meteor.user().accs + Meteor.user().wds;
		return ((Meteor.user().rejs / total) * 100);
	},
	nonRejWidth: function () {
		var percent = accWidth() + wdWidth();
		return (percent);
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

/// statUpdate

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
	passwordSignupFields: "USERNAME_AND_EMAIL"
});

Deps.autorun(function() {
	Meteor.subscribe('userData');
  	Meteor.subscribe('userScores');
});
