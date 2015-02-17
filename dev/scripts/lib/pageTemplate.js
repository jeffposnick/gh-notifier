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

'use strict';

var firebaseRefs = require('./firebaseRefs.js');

var ref = firebaseRefs.ref;
var repoToSubscriptionIdsRef = firebaseRefs.repoToSubscriptionIdsRef;
var firebaseUrl = firebaseRefs.firebaseUrl;
var gitHubActivityFirebaseUrl = firebaseRefs.gitHubActivityFirebaseUrl;

module.exports = function(t) {
  var showToast = function(text) {
    var toast = document.querySelector('paper-toast');
    toast.text = text;
    toast.show();
  };

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

  t.logout = function() {
    ref.unauth();
    t.loggedIn = false;
    t.selectedPage = 'log-in';
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
      return webHook.config.url.indexOf(firebaseUrl) === 0;
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
          url: gitHubActivityFirebaseUrl,
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

    fetch(request).then(function() {
      showToast('Notification settings updated.');
      t.showChooseRepo();
    }).catch(function(error) {
      showToast(error);
    });
  };

  t.toggleSubscriptionToRepo = function(e) {
    var name = e.target.templateInstance.model.gitHubRepo.name;
    if (e.target.checked) {
      repoToSubscriptionIdsRef.child(e.target.id).push(t.subscriptionId);
      showToast('Notifications for ' + name + ' will be delivered to this browser.');
    } else {
      repoToSubscriptionIdsRef.child(e.target.id).once('value', function(snapshot) {
        var currentSubscriptions = snapshot.val();
        Object.keys(currentSubscriptions).forEach(function(key) {
          if (currentSubscriptions[key] == t.subscriptionId) {
            snapshot.ref().child(key).remove();
          }
        });
      });
      showToast('Notifications for ' + name + ' will no longer be delivered to this browser.');
    }
  };

  t.showEditRepo = function(e) {
    t.selectedRepo = e.target.templateInstance.model.gitHubRepo;
    t.selectedPage = 'edit-repo';
  };

  t.processGitHubRepos = function(e) {
    t.gitHubRepos = e.detail.response;

    repoToSubscriptionIdsRef.once('value', function(snapshot) {
      var repoIdToSubscriptionIds = snapshot.val();
      t.gitHubRepos.forEach(function(gitHubRepo) {
        gitHubRepo.activeSubscription = false;
        Object.keys(repoIdToSubscriptionIds).forEach(function(repoId) {
          if (gitHubRepo.id == repoId) {
            gitHubRepo.activeSubscription = Object.keys(repoIdToSubscriptionIds[repoId]).some(function(key) {
              return repoIdToSubscriptionIds[repoId][key] == t.subscriptionId;
            });
          }
        });
      });
    });
  };

  t.showChooseRepo = function() {
    t.selectedPage = 'choose-repo';
  };

  t.addEventListener('template-bound', function() {
    navigator.serviceWorker.register('service-worker.js').catch(function(error) {
      showToast('Service worker registration failed:' + error);
    });

    ref.onAuth(function(authData) {
      if (authData) {
        t.loggedIn = true;
        t.authData = authData;
        showToast('Logged in.');
        t.showChooseRepo();

        Notification.requestPermission(function(result) {
          if (result === 'granted') {
            navigator.serviceWorker.ready.then(function(registration) {
              registration.pushManager.subscribe().then(function(subscription) {
                t.subscriptionId = subscription.subscriptionId;
              }).catch(function(error) {
                showToast('BUG: PLEASE RELOAD PAGE. Push registration failed: ' + error);
              });
            });
          } else {
            showToast('Unable to proceed without notification permission.');
          }
        });
      } else {
        t.loggedIn = false;
        t.selectedPage = 'log-in';
      }
    });
  });
};
