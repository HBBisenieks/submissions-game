# submissions-game

It all started when I saw Sunil @ghostwritingcow Patel talking about this game that he and his writing group play.  Every submission they log and rejection they receive is worth a point, while an acceptance retest your score to zero, and then there's an informal leader-board, I guess.  I'm not in his group, so I don't know the specifics.  But anyway, I thought, well, there should be a way to make this simple game needlessly complicated.  So I decided I should make an app.  Because I'm a millenial, and that's what we do, right?  Right?

R I G H T ? ! ?

Right.

So.

At the moment, the Submissions Game is meant to be deployed on a per-group basis.  Probably I'll add in more functionality later?  I don't know.  Right now, I'm just focussed on getting the core functionality for a single writing group working.

The Submissions Game is built off of Meteor.

# Installation

Currently submissions-game is a beta product. While groups have been implemented, group administration is still not fully refined: once set, a group's description and secret are still fixed, so although you can kick a member from a group if you are an admin, there's nothing to prevent them from re-joining. Also, it's entirely possible to orphan a group and leave it without any admins. Perhaps more importantly, signing up for an account is trivially simple right now; just provide a username and password--no email confirmation needed.

If you're undeterred by the above, getting your own instance of submissions-game up and running isn't terribly challenging.  Install Meteor first, if you haven't already, as submissions-game depends on it.

After Meteor installation has finished, clone the repo and cd into the resulting directory and then run meteor, and you're done.

# Upgrading

If you're upgrading from code revisions predating release v0.3.5, all current users will have to manually update their display names; at this time, there is no way to automatically run this operation, and none will be implemented, as this is a situation arising from pre-release code.
