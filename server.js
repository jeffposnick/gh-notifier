var https = require('https');
var URL = require('dom-urls');
var Firebase = require('firebase');

var FIREBASE_URL = 'https://burning-inferno-3626.firebaseio.com';
var GCM_URL = new URL('https://android.googleapis.com/gcm/send');

var ref = new Firebase(FIREBASE_URL);
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
          console.error('GCM returned an error:', error);
        } else {
          var response = JSON.parse(responseBody);
          if (response.success) {
            gitHubActivity.ref().remove();
          } else {
            console.error('GCM returned an error:', response);
          }
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
    hostname: GCM_URL.hostname,
    method: 'POST',
    path: GCM_URL.pathname
  };

  var body = {
    data: {
      title: 'Title from GCM',
      message: 'Message from GCM'
    },
    'registration_ids': subscriptionIds
  };

  var request = https.request(options, function(response) {
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
