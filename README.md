# gh-notifier
Get notifications about [GitHub events](https://developer.github.com/webhooks/#events) in your browser.
Try it at https://jeffy.info/gh-notifier/

## Help
- After logging in via GitHub, toggle notifications on/off for each of your repos.
- The toggle applies to the current browser on the current device. You can enable notifications
on multiple devices by visiting this page from each device.
- Use the "Triggers" button to control which GitHub events will trigger a notification. These
settings apply globally to the GitHub repo itself. If there isn't already a
[Webhook](https://developer.github.com/webhooks/) set up for the repo, adding triggers creates one.

## Requirements
Any web browser that supports [service worker notifications](https://notifications.spec.whatwg.org/#service-worker-api).
As of February 2015, this means [Chrome 42+](https://www.google.com/chrome/browser/canary.html)
with the "Enable experimental Web Platform features" turned on via
`chrome://flags/#enable-experimental-web-platform-features`.

## Technologies Used
- [Polymer](https://www.polymer-project.org/)
- [Service worker notifications](https://www.chromestatus.com/feature/5480344312610816)
- [Web Application Manifest](https://www.chromestatus.com/feature/6488656873259008)
- [Firebase](https://www.firebase.com/)
- [GitHub REST API](https://developer.github.com/v3/)
- [GitHub Webhooks](https://developer.github.com/webhooks/)
- [Google Cloud Messaging](https://developer.android.com/google/gcm/index.html)
- [Fetch API](https://www.chromestatus.com/feature/6730533392351232)
- [Browserify](http://browserify.org/)
- [Gulp](http://gulpjs.com/)
- [Node.JS](http://nodejs.org/)

## License
[Apache 2.0](https://raw.githubusercontent.com/jeffposnick/gh-notifier/master/LICENSE) © 2015 Google Inc.
