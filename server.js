var https = require('https');
var URL = require('dom-urls');
var firebaseRefs = require('./dev/scripts/lib/firebaseRefs.js');

var ref = firebaseRefs.ref;
var gitHubActivityRef = firebaseRefs.gitHubActivityRef;
var repoToSubscriptionIdsRef = firebaseRefs.repoToSubscriptionIdsRef;
var gcmUrl = new URL('https://android.googleapis.com/gcm/send');

ref.child('apiKey').once('value', function(data) {
  var apiKey = data.val();

  gitHubActivityRef.on('child_added', function(data) {
    var repoId = data.val().repository.id;

    repoToSubscriptionIdsRef.child(repoId).once('value', function(data) {
      var subscripitionIdsMapping = data.val();
      var subscriptionIds = Object.keys(subscripitionIdsMapping).map(function(key) {
        return subscripitionIdsMapping[key];
      });

      console.log('Sending notification about repo', repoId, 'to subscriptions', subscriptionIds);

      sendNotification(apiKey, subscriptionIds, function(error, responseBody) {
        if (error) {
          console.error('GCM request resulted in an error:', error);
        } else {
          var response = JSON.parse(responseBody);
          if (response.success) {
            gitHubActivityRef.ref().remove();
          } else {
            console.error('GCM returned an error response:', response);
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
    hostname: gcmUrl.hostname,
    method: 'POST',
    path: gcmUrl.pathname
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
