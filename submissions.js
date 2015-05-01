// Writers = new Mongo.Collection('writers');
// Submissions = new Mongo.Collection("submissions");

if (Meteor.isClient) {

  Template.body.helpers({
	  userScore: function () {
		  return Meteor.user().score;
	  }
  });

  Template.leaderboard.helpers({
	  writer: function () {
		  return Meteor.users.find({}, {fields: {username: 1, score: 1}, sort: {score: -1}});
	  }
  });

  Template.userStats.helpers({
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
}

if (Meteor.isServer) {
  Meteor.startup(function () {
  	Meteor.publish('userScores', function () {
  		return Meteor.users.find({}, {profile: {subs: 1, rejs: 1, accs: 1, wds: 1, score: 1}});
  	});
  });

  Accounts.onCreateUser(function(options, user) {
	  user.subs = 0;
	  user.rejs = 0;
	  user.accs = 0;
	  user.wds = 0;
	  user.score = 0;

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
		  score: 1}
	  });
  });

}
  Meteor.methods({
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
  		Meteor.users.update(Meteor.userId(), {$inc: {accs: 1}});
  	},

  	decAccs: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {accs: -1}});
  	},

  	incWds: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {wds: 1}});
  	},

  	decWds: function () {
  		Meteor.users.update(Meteor.userId(), {$inc: {wds: -1}});
  	}

  });
