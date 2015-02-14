var http = require('http');
var util = require('util');
var URL = require('dom-urls');
var Firebase = require('firebase');

var FIREBASE_INSTANCE = 'burning-inferno-3626';
var GCM_URL = new URL('https://android.googleapis.com/gcm/send');

var ref = new Firebase(util.format('https://%s.firebaseio.com', FIREBASE_INSTANCE));
var gitHubRef = ref.child('githubActivity');
var repoToSubscriptionIdsRef = ref.child('repoToSubscriptionIds');

ref.child('apiKey').once('value', function(data) {
  apiKey = data.val();

  gitHubRef.on('child_added', function(gitHubActivity) {
    var repoId = gitHubActivity.val().repository.id;
    repoToSubscriptionIdsRef.child(repoId).once('value', function(data) {
      var subscripitionIdsMapping = data.val();
      var subscriptionIds = Object.keys(subscripitionIdsMapping).map(function(key) {
        return subscripitionIdsMapping[key];
      });
      sendNotification(apiKey, subscriptionIds, function(error, responseBody) {
        if (error) {
          console.error(error);
        } else {
          console.log(responseBody);
          gitHubActivity.ref().remove();
        }
      });
    });
  });
});

function sendNotification(apiKey, subscriptionIds, callback) {
  var options = {
    headers: {
      authorization: 'key=' + apiKey,
      'content-type': 'application/json'
    },
    host: GCM_URL.origin,
    method: 'POST',
    path: GCM_URL.pathname
  };

  var body = {
    data: {
      dummy: true
    },
    'registration_ids': subscriptionIds
  };

  var request = http.request(options, function(response) {
    var responseBody = '';

    response.on('data', function(chunk) {
      responseBody += chunk;
    });

    response.on('end', function() {
      callback(null, responseBody);
    });
  });

  request.on('error', function(error) {
    callback(error);
  });

  request.write(JSON.stringify(body));
  request.end();
}
