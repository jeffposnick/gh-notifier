var querystring = require('querystring');

var queryParams = querystring.parse(window.location.search.slice(1));
if (queryParams.url) {
  window.location.href = queryParams.url;
} else {
  console.error('Could not redirect. Parsed querystring is', queryParams);
}
