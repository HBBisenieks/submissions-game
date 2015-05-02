// Client code

  Template.body.helpers({
	  userScore: function () {
		  // return user's score
		  return Meteor.user().score;
	  }
  });

  Template.leaderboard.helpers({
	  writer: function () {
		  // return all user's attributes for leaderboard
		  return Meteor.users.find({}, {fields: {username: 1, subs: 1, rejs: 1, accs: 1, wds: 1, score: 1}, sort: {score: -1}});
	  }
  });

  Template.trophy.helpers({
	  leading: function () {
		  // Return true if current user has highest score
		  // tropy template displays trophy for user with highest score
		  // 
		  // Will display trophy to multiple users who share high score
		  // even though leaderboard will still rank one above others
		  if (Meteor.userId() === Meteor.users.findOne({}, {fields: {_id: 1}, sort: {score: -1}})._id) {
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
