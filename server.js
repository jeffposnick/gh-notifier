var dateFormat = require('date-format');
var https = require('https');
var URL = require('dom-urls');
var firebaseRefs = require('./dev/scripts/lib/firebaseRefs.js');

var ref = firebaseRefs.ref;
var gitHubActivityRef = firebaseRefs.gitHubActivityRef;
var repoToSubscriptionIdsRef = firebaseRefs.repoToSubscriptionIdsRef;
var gcmUrl = new URL('https://android.googleapis.com/gcm/send');

logInfo('Starting up...');

ref.child('apiKey').once('value', function(data) {
  var apiKey = data.val();

  gitHubActivityRef.on('child_added', function(data) {
    var updatePayload = data.val();
    var repoId = updatePayload.repository.id;

    repoToSubscriptionIdsRef.child(repoId).once('value', function(data) {
      var subscripitionIdsMapping = data.val();

      if (subscripitionIdsMapping) {
        var subscriptionIds = Object.keys(subscripitionIdsMapping).map(function(key) {
          return subscripitionIdsMapping[key];
        });

        logInfo('Sending notification about repo', repoId, 'to subscriptions', subscriptionIds);

        sendNotification(apiKey, subscriptionIds, updatePayload, function(error, responseBody) {
          if (error) {
            logError('GCM request resulted in an error:', error);
          } else {
            var response = JSON.parse(responseBody);
            if (response.success) {
              gitHubActivityRef.ref().remove();
            } else {
              logError('GCM returned an error response:', response);
            }
          }
        });
      } else {
        logError('Got a notification for repo', repoId, 'but there are no subscribers.');
        gitHubActivityRef.ref().remove();
      }
    });
  });
});

function sendNotification(apiKey, subscriptionIds, updatePayload, callback) {
  var options = {
    headers: {
      authorization: 'key=' + apiKey,
      'content-type': 'application/json'
    },
    hostname: gcmUrl.hostname,
    method: 'POST',
    path: gcmUrl.pathname
  };

  var data = {};
  try {
    data = {
      icon: updatePayload.sender.avatar_url,
      message: updatePayload.repository.full_name + ' was updated by ' + updatePayload.sender.login,
      tag: updatePayload.repository.full_name,
      title: 'GitHub Activity'
    }
  } catch(error) {
    logError('Error while assigning data:', error, updatePayload);
  }

  var body = {
    data: data,
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

function logInfo() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('[' + dateFormat('yyyy-MM-dd hh:mm:ss', new Date()) + ']', 'INFO');
  console.log.apply(console, args);
}

function logError() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('[' + dateFormat('yyyy-MM-dd hh:mm:ss', new Date()) + ']', 'ERROR');
  console.log.apply(console, args);
}
