# Sink or Submit!

It all started when I saw Sunil @ghostwritingcow Patel talking about this game that he and his writing group play.  Every submission they log and rejection they receive is worth a point, while an acceptance retest your score to zero, and then there's an informal leader-board, I guess.  I'm not in his group, so I don't know the specifics.  But anyway, I thought, well, there should be a way to make this simple game needlessly complicated.  So I decided I should make an app.  Because I'm a millenial, and that's what we do, right?  Right?

R I G H T ? ! ?

Right.

So.

At the moment, Sink or Submit is meant to be deployed on a per-group basis.  Probably I'll add in more functionality later?  I don't know.  Right now, I'm just focussed on getting the core functionality for a single writing group working.

Sink or Submit is built off of Meteor.

# Installation

Sink or Submit is now at v1.0. The public implementation is available at <http://sinkorsub.meteor.com/>. If you would like to deploy the latest release or the most recent commits for personal use or for development and testing, either head to the releases page or clone the most recent code using

    git clone https://github.com/hbbisenieks/submissions-game

You will also need to enter your own smtp settings if you're going to use or test the email verification features. A good walkthrough for configuring email can be found at Gentlenode (https://gentlenode.com/journal/meteor-20-verify-an-email-with-meteor-accounts/42).

# Upgrading

If you're upgrading from code revisions predating release v0.3.5, all current users will have to manually update their display names; at this time, there is no way to automatically run this operation, and none will be implemented, as this is a situation arising from pre-release code.
