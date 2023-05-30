### [StreamLive To](https://github.com/warren-bank/crx-StreamLive-To/tree/webmonkey-userscript/es6)

[Userscript](https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es6/webmonkey-userscript/StreamLive-To.user.js) for [streamlive.to](https://www.streamlive.to/) to run in:
* the [WebMonkey](https://github.com/warren-bank/Android-WebMonkey) application for Android

Its purpose is to:
* conditionally filter the list of channels
  - display only the free channels, all on a single page
* when the page for a particular channel is loaded, transfer its video stream to the top-level tool on the [Webcast-Reloaded](https://github.com/warren-bank/crx-webcast-reloaded) external [website](https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html)
  - mainly for use with:
    * _Google Chromecast_
    * [_ExoAirPlayer_](https://github.com/warren-bank/Android-ExoPlayer-AirPlay-Receiver)
    * [_HLS-Proxy_](https://github.com/warren-bank/HLS-Proxy)

#### Stale Branch:

* this branch is no-longer maintained
  - the [`webmonkey-userscript/es5`](https://github.com/warren-bank/crx-StreamLive-To/tree/webmonkey-userscript/es5) branch:
    * includes a userscript that provides enhanced functionality
    * supports older browsers (ex: Android 4.x WebView)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
