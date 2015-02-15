'use strict';

navigator.serviceWorker.register('service-worker.js');

var FIREBASE_URL = 'https://burning-inferno-3626.firebaseio.com';
var ref = new Firebase(FIREBASE_URL);

var t = document.querySelector('#page-template');

t.allWebhookEvents = [
  'commit_comment',
  'create',
  'delete',
  'deployment',
  'deployment_status',
  'fork',
  'gollum',
  'issue_comment',
  'issues',
  'member',
  'page_build',
  'public',
  'pull_request',
  'pull_request_review_comment',
  'push',
  'release',
  'status',
  'team_add',
  'watch'
];

t.scrollToTop = function(e) {
  if (e.detail.isSelected) {
    window.scrollTo(0, 0);
  }
};

t.login = function() {
  ref.authWithOAuthRedirect('github', function(error) {
    if (error) {
      showToast('Login failed:' + error);
    }
  }, {scope: 'admin:repo_hook'});
};

t.processHooks = function(e) {
  var eventElements = document.querySelectorAll('.event');
  [].forEach.call(eventElements, function(eventElement) {
    eventElement.disabled = false;
  });

  var ourWebHooks = e.detail.response.filter(function(webHook) {
    return webHook.config.url.indexOf(FIREBASE_URL) === 0;
  });

  if (ourWebHooks.length > 0) {
    t.activeWebhook = ourWebHooks[0];
    t.activeWebhook.events.forEach(function(activeEvent) {
      document.querySelector('#' + activeEvent).checked = true;
    });
  }
};

t.saveWebhook = function() {
  var eventElements = document.querySelectorAll('.event');
  var activeEvents = [].filter.call(eventElements, function(eventElement) {
    return eventElement.checked;
  }).map(function(eventElement) {
    return eventElement.id;
  });

  var method, url, body;
  if (t.activeWebhook) {
    url = t.activeWebhook.url;
    if (activeEvents.length > 0) {
      method = 'PATCH';
      body = {
        events: activeEvents
      };
    } else {
      method = 'DELETE';
    }
  } else {
    method = 'POST';
    url = t.selectedRepo.hooks_url;
    body = {
      active: true,
      config: {
        url: FIREBASE_URL + '/githubActivity.json',
        'content_type': 'json'
      },
      events: activeEvents,
      name: 'web'
    };
  }

  var request = new Request(url, {
    method: method,
    headers: {
      authorization: 'token ' + t.authData.github.accessToken
    },
    body: body ? JSON.stringify(body) : null
  });

  fetch(request).then(function(response) {
    showToast('Notification settings updated.');
    t.showChooseRepo();

    if (method === 'POST') {
      ref.child('repoToSubscriptionIds').child(t.selectedRepo.id).push(t.subscriptionId);
    } else if (method === 'DELETE') {
      ref.child('repoToSubscriptionIds').child(t.selectedRepo.id).once('value', function(snapshot) {
        var currentSubscriptions = snapshot.val();
        Object.keys(currentSubscriptions).forEach(function(key) {
          if (currentSubscriptions[key] === t.subscriptionId) {
            ref.child('repoToSubscriptionIds').child(t.selectedRepo.id).child(key).remove();
          }
        });
      });
    }
  }).catch(function(error) {
    showToast(error);
  });
};

t.showEditRepo = function(e) {
  t.selectedRepo = e.target.templateInstance.model.gitHubRepo;
  t.selectedPage = 'edit-repo';
};

t.showChooseRepo = function() {
  t.selectedPage = 'choose-repo';
};

t.addEventListener('template-bound', function() {
  ref.onAuth(function(authData) {
    if (authData) {
      t.loggedIn = true;
      t.authData = authData;
      showToast('Logged in.');
      t.showChooseRepo();

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
      t.selectedPage = 'log-in';
    }
  });
});

function showToast(text) {
  var toast = document.querySelector('paper-toast');
  toast.text = text;
  toast.show();
}
