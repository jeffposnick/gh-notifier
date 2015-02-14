var Firebase = require('firebase');
var ref = new Firebase('https://burning-inferno-3626.firebaseio.com');
var gitHubRef = ref.child('github');
var repoToSubscriptionIdsRef = ref.child('repoToSubscriptionIds');

var apiKey;
ref.child('apiKey').once('value', function(data) {
  apiKey = data.val();
});

gitHubRef.on('child_added', function(gitHubActivity) {
  var repoId = gitHubActivity.val().repository.id;
  gitHubRef.remove();
  repoToSubscriptionIdsRef.child(repoId).once('value', function(data) {
    var subscripitionIds = data.val();
    Object.keys(subscripitionIds).forEach(function(key) {
      console.log(subscripitionIds[key]);
    });
  });
});
