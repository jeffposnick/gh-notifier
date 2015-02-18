/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var dateFormat = require('date-format');
var https = require('https');
var URL = require('dom-urls');
var firebaseRefs = require('./dev/scripts/lib/firebaseRefs.js');

var ref = firebaseRefs.ref;
var gitHubActivityRef = firebaseRefs.gitHubActivityRef;
var repoToSubscriptionIdsRef = firebaseRefs.repoToSubscriptionIdsRef;
var gcmUrl = new URL('https://android.googleapis.com/gcm/send');
var secretEnvironmentVariable = 'FIREBASE_SECRET';

logInfo('Starting up...');

if (!process.env[secretEnvironmentVariable]) {
  logError('Please make sure to set and export the',
    secretEnvironmentVariable, 'environment variable using the Firebase secret from',
    firebaseRefs.firebaseUrl + '/?page=Admin');
  process.exit(1);
}

ref.authWithCustomToken(process.env[secretEnvironmentVariable], function(error, result) {
  if (error) {
    logError('Firebase authentication failed. Please make sure to set and export the',
             secretEnvironmentVariable, 'environment variable using the Firebase secret from',
             firebaseRefs.firebaseUrl + '/?page=Admin (code:', error.code + ')');
    process.exit(1);
  } else {
    logInfo('Successfully authenticated.');
    ref.child('apiKey').once('value', function(snapshot) {
      listenForNewActivity(snapshot.val());
    });
  }
});

function listenForNewActivity(apiKey) {
  gitHubActivityRef.on('child_added', function(gitHubActivitySnapshot) {
    var updatePayload = gitHubActivitySnapshot.val();
    var repoId = updatePayload.repository.id;

    repoToSubscriptionIdsRef.child(repoId).once('value', function(subscriptionIdsSnapshot) {
      var subscripitionIdsMapping = subscriptionIdsSnapshot.val();

      if (subscripitionIdsMapping) {
        var subscriptionIds = Object.keys(subscripitionIdsMapping);

        logInfo('Sending notification about repo', repoId, 'to subscriptions', subscriptionIds);

        sendNotification(apiKey, subscriptionIds, updatePayload, function(error, responseBody) {
          if (error) {
            logError('GCM request resulted in an error:', error);
          } else {
            var response = JSON.parse(responseBody);
            if (response.success) {
              gitHubActivitySnapshot.ref().remove();
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
}

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
      message: 'There was activity in ' + updatePayload.repository.full_name +
               ' initiated by ' + updatePayload.sender.login,
      tag: updatePayload.repository.url,
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
