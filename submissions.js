Writers = new Mongo.Collection('writers');
// Submissions = new Mongo.Collection("submissions");

if (Meteor.isClient) {
  Session.setDefault('userSubs', 0);
  Session.setDefault('userRejections', 0);
  Session.setDefault('userAccept', 0);
  Session.setDefault('userWithdraw', 0);
  Session.setDefault('userScore', 0);

  Template.body.helpers({
	  userScore: function () {
		  var score = Session.get('userSubs') + Session.get('userRejections');
		  return score;
	  }
  });

  Template.leaderboard.helpers({
	  writer: function () {
		  return Meteor.users.find({sort: {score: -1}});
	  }
  });

  Template.userStats.helpers({
	  userSubs: function () {
		  return Meteor.user().subs;
//		  return Meteor.users.find(this.userId, {fields: subs});
		  return Session.get('userSubs');
	  },
	  userRejections: function () {
		  return Session.get('userRejections');
	  },
	  userAccept: function () {
		  return Session.get('userAccept');
	  },
	  userWithdraw: function () {
		  return Session.get('userWithdraw');
	  },
  	  userScore: function () {
		  var rej = Session.get('userRejections');
		  var sub = Session.get('userSubs');
		  var score = rej + sub;
		  return score;
	  }
  });

  Template.statUpdate.events({
	  'click .subPlus': function () {
		  // increment user submission
		  Session.set('userSubs', Session.get('userSubs') + 1);
		  var writerId = Meteor.userId();
		  Meteor.users.update(writerId, {$inc: {subs: 1}});
	  },
	  'click .subMinus': function () {
		  // Only decrement submissions if it would not take submission number below total number of responses
		  var responses = Session.get('userRejections') + Session.get('userAccept') + Session.get('userWithdraw');
		  if (Session.get('userSubs') > responses) {
			  // Confirm before removing submission
			  if (confirm('Remove submission?')) {
				  Session.set('userSubs', Session.get('userSubs') - 1);
			  }
		  }
	   },
	  'click .rejPlus': function () {
		  // increment user rejection only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			   Session.set('userRejections', Session.get('userRejections') +1);
		  }
	  },
	  'click .rejMinus': function () {
		  if (Session.get('userRejections') > 0) {
			  // Confirm before removing rejection
			  if (confirm('Remove rejection?')) {
				  Session.set('userRejections', Session.get('userRejections') - 1);
		 	 }
		  }
	  },
	  'click .accPlus': function () {
		  // increment user acceptance only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			  Session.set('userAccept', Session.get('userAccept') +1);
		  }
	  },
	  'click .accMinus': function () {
		  if (Session.get('userAccept') > 0) {
			  // Confirm before removing acceptance
			  if (confirm('Remove acceptance?')) {
				  Session.set('userAccept', Session.get('userAccept') - 1);
			  }
		  }
	  },
	  'click .wdPlus': function () {
		  // increment user withdrawals only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			  Session.set('userWithdraw', Session.get('userWithdraw') +1);
		  }
	  },
	  'click .wdMinus': function () {
		  if (Session.get('userWithdraw') > 0) {
			  // Confirm before removing withdrawal
			  if (confirm('Remove withdrawal?')) {
				  Session.set('userWithdraw', Session.get('userWithdraw') - 1);
			  }
		  }
	  }
  });

  Accounts.ui.config({
	  passwordSignupFields: "USERNAME_ONLY"
  });

  Deps.autorun(function() {
	  Meteor.subscribe('userData');
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
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
