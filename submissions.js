Submissions = new Mongo.Collection("submissions");

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('counter', 0);
  Session.setDefault('userSubs', 0);
  Session.setDefault('userRejections', 0);
  Session.setDefault('userAccept', 0);
  Session.setDefault('userWithdraw', 0);
  Session.setDefault('userScore', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });

  Template.userStats.helpers({
	  userSubs: function () {
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

  Template.subPlus.events({
	  'click button': function () {
		  // increment user submission
		  Session.set('userSubs', Session.get('userSubs') + 1);
	  }
  });

   Template.subMinus.events({
	   'click button': function () {
		   // Only decrement submissions if it would not take submission number below total number of responses
		   var responses = Session.get('userRejections') + Session.get('userAccept') + Session.get('userWithdraw');
		   if (Session.get('userSubs') > responses) {
			   // Confirm before removing submission
			   if (confirm('Remove submission?')) {
				   Session.set('userSubs', Session.get('userSubs') - 1);
			   }
		   }
	   }
   });

  Template.rejPlus.events({
	  'click button': function () {
		  // increment user rejection only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			   Session.set('userRejections', Session.get('userRejections') +1);
		  }
	  }
  });

  Template.rejMinus.events({
	  'click button': function () {
		  if (Session.get('userRejections') > 0) {
			  // Confirm before removing rejection
			  if (confirm('Remove rejection?')) {
				  Session.set('userRejections', Session.get('userRejections') - 1);
		 	 }
		  }
	  }
  });

  Template.accPlus.events({
	  'click button': function () {
		  // increment user acceptance only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			  Session.set('userAccept', Session.get('userAccept') +1);
		  }
	  }
  });

  Template.accMinus.events({
	  'click button': function () {
		  if (Session.get('userAccept') > 0) {
			  // Confirm before removing acceptance
			  if (confirm('Remove acceptance?')) {
				  Session.set('userAccept', Session.get('userAccept') - 1);
			  }
		  }
	  }
  });

  Template.wdPlus.events({
	  'click button': function () {
		  // increment user withdrawals only if sum of responses is less than number of submissions
		  var rej = Session.get('userRejections');
		  var acc = Session.get('userAccept');
		  var wd = Session.get('userWithdraw');
		  var responses = rej + acc + wd;
		  if (responses < Session.get('userSubs')) {
			  Session.set('userWithdraw', Session.get('userWithdraw') +1);
		  }
	  }
  });

  Template.wdMinus.events({
	  'click button': function () {
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
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
