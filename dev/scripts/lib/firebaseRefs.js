'use strict';

var Firebase = require('firebase');

var firebaseUrl = 'https://burning-inferno-3626.firebaseio.com';
var ref = new Firebase(firebaseUrl);

module.exports = {
  firebaseUrl: firebaseUrl,
  gitHubActivityFirebaseUrl: firebaseUrl + '/githubActivity.json',
  gitHubActivityRef: ref.child('githubActivity'),
  ref: ref,
  repoToSubscriptionIdsRef: ref.child('repoToSubscriptionIds'),
  subscriptionsRef: ref.child('subscriptions')
};
