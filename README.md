### [StreamLive To](https://github.com/warren-bank/crx-StreamLive-To)

#### Summary:

Chromium browser extension:
* works on pages that are hosted at:
  * [`www.streamlive.to/channels`](https://www.streamlive.to/channels)
  * [`www.streamlive.to/view/*`](https://www.streamlive.to/channels)

#### UI:

* there is no user interface (UI)
* the extension works silently in the background
  * on pages that list available channels:
    * load many more channels per page
    * filter the channels to only display only the ones that are free to access
  * on pages containing an embedded video player:
    * removes all page content except the embedded video player
    * dramatically reduces CPU load
* after installation, an icons is added to the "Chrome toolbar"
  * there is no way for the extension to prevent this from happening
  * to hide ( but [not remove](https://superuser.com/questions/1048619) ) it, you can right-click on the icon and select: "Hide in Chrome menu"

#### manual steps needed to remove anonymous window event listeners:

* on pages containing an embedded video player:
  * instructions:
    * open DevTools
    * enter into the console:
      ```javascript
        removeEventListeners(window)
      ```
  * summary:
    * these listeners open new browser tabs to nasty websites every time the 'mousedown' event fires on window
    * unfortunately, the API needed to remove them is only available in DevTools
    * `removeEventListeners` is a helper function added by the extension
    * the _Console Utilities API_ it depends upon is [getEventListeners](https://developers.google.com/web/tools/chrome-devtools/console/utilities#geteventlistenersobject)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
