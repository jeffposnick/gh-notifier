'use strict';

navigator.serviceWorker.register('service-worker.js');

var t = document.querySelector('#page-template');

t.login = function() {
  ref.authWithOAuthRedirect('github', function(error) {
    if (error) {
      console.error('Login failed:', error);
    }
  });
};

t.addWebhook = function(e) {
  /*var url = e.target.templateInstance.model.gitHubRepo.hooks_url;
  var body = {
    name: 'web',
    active: 'false',
    events: ['push'],
    config: {
      url: 'http://example.com',
      'content_type': 'json'
    }
  };
  var request = new Request(url, {
    method: 'POST',
    headers: {
      authorization: 'token ' + t.authData.github.accessToken
    },
    body: JSON.stringify(body)
  });

  fetch(request).then(function(response) {
    response.json().then(function(json) {
      console.log(json);
    });
  }).catch(function(error) {
    console.error(error);
  });*/

  ref.child('repoToSubscriptionIds').child(e.target.templateInstance.model.gitHubRepo.id).push(t.subscriptionId);
};

var ref = new Firebase('https://burning-inferno-3626.firebaseio.com');

ref.onAuth(function(authData) {
  if (authData) {
    t.loggedIn = true;
    t.authData = authData;

    var userSubscriptionRef = ref.child('subscriptions').child(authData.uid);

    userSubscriptionRef.once('value', function(subscription) {
      if (subscription.val()) {
        t.subscriptionId = subscription.val().subscriptionId;
      } else {
        Notification.requestPermission(function (result) {
          if (result !== 'denied') {
            navigator.serviceWorker.ready.then(function(registration) {
              registration.pushManager.subscribe().then(function(subscription) {
                t.subscriptionId = subscription.subscriptionId;

                userSubscriptionRef.set({
                  subscriptionId: subscription.subscriptionId
                });
              });
            });
          }
        });
      }
    });
  } else {
    t.loggedIn = false;
  }
});

