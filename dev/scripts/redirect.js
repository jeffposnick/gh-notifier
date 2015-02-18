var querystring = require('querystring');

var queryParams = querystring.parse(window.location.search.slice(1));
if (queryParams.url) {
  window.location.href = queryParams.url;
} else {
  var pElement = document.createElement('p');
  pElement.textContent = 'Unable to redirect due to missing "url=" query string parameter.';
  document.body.appendChild(pElement);
}
