// https://developer.chrome.com/extensions/devtools
// https://developer.chrome.com/extensions/devtools_inspectedWindow#method-eval

// to debug this page in devtools:
// * (Ctrl+Shift+I) open devtools
// * undock devtools into separate window
// * (Ctrl+Shift+J) open the developer tools of the devtools
// * in window selection dropdown, change from "top" to "devtools.html"

chrome.devtools.inspectedWindow.eval(
  'if (typeof window.removeEventListeners !== "function") throw new Error("noop"); window.removeEventListeners(window)',
  function(result, isException) {
    if (! isException)
      console.log('success: window event listeners are removed')
  }
)
