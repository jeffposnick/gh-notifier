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

self.addEventListener('install', function(e) {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(e) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    console.error('Failed to display notification - not supported');

    // Perhaps we don't have permission to show a notification
    if (self.Notification) {
      console.error('  notificaton permission set to:',
        self.Notification.permission);
    }
    return;
  }

  var data = {};
  if (e.data) {
    data = e.data.json();
  }
  // Chrome 42 doesn't support retrieving the data from the message at this time.
  // Assign some default strings to use instead.
  var title = data.title || 'GitHub Activity';
  var message = data.message || 'Sorry, details are not available.';
  var icon = data.icon || 'images/icon.png';
  var tag = data.tag || 'gh-notifier';

  var notification = new Notification(title, {
    body: message,
    icon: icon,
    tag: tag
  });

  return notification;
});

self.addEventListener('pushsubscriptionlost', function(e) {
  console.log(e);
});

self.addEventListener('notificationclick', function(e) {
  console.log('Notification click received.');

  if (clients.openWindow) {
    clients.openWindow('https://gauntface.com/blog/2014/12/15/push-notifications-service-worker');
  } else {
    console.log('Notification clicked, but clients.openWindow is not currently supported');
  }
});
