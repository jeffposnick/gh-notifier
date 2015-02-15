'use strict';

var config = require('./config.js');
var Firebase = require('firebase');

var ref = new Firebase(config.firebaseUrl)
var repoToSubscriptionIdsRef = ref.child('repoToSubscriptionIds');
var subscriptionsRef = ref.child('subscriptions');

module.exports = {
  ref: ref,
  repoToSubscriptionIdsRef: repoToSubscriptionIdsRef,
  subscriptionsRef: subscriptionsRef
};
