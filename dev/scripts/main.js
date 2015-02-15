'use strict';

navigator.serviceWorker.register('service-worker.js');

require('./lib/initializeTemplate.js')(document.querySelector('#page-template'));
