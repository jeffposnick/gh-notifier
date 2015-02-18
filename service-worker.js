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
  // Chrome 42 doesn't support retrieving the data from the message at this time.
  // Assign some default strings to use instead.
  var data = e.data ? e.data.json() : {};
  self.registration.showNotification(data.title || 'GitHub Activity', {
    body: data.message || 'Sorry, details are not available.',
    icon: data.icon || 'images/icon.png',
    tag: data.tag || 'https://github.com/'
  });
});

self.addEventListener('notificationclick', function(e) {
  if (e.notification.tag !== 'user_visible_auto_notification') {
    // Open a same-origin page until https://code.google.com/p/chromium/issues/detail?id=457187
    // is resolved.
    clients.openWindow('redirect.html?url=' + encodeURIComponent(e.notification.tag));
  }
});
