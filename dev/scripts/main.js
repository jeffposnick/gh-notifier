'use strict';

navigator.serviceWorker.register('service-worker.js');

require('./lib/pageTemplate.js')(document.querySelector('#page-template'));
