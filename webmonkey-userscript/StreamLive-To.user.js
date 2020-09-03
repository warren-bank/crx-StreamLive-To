// ==UserScript==
// @name         StreamLive To
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://streamlive.to/*
// @match        *://*.streamlive.to/*
// @icon         https://streamlive.to/favicon.ico
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-StreamLive-To/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-StreamLive-To/issues
// @downloadURL  https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es5/webmonkey-userscript/StreamLive-To.user.js
// @updateURL    https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es5/webmonkey-userscript/StreamLive-To.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// =============================================================================

var init = function() {
  var url_path = unsafeWindow.location.pathname.toLowerCase()

  if (url_path.indexOf('/info/') === 0) {
    // channel info page
    //   => redirect to channel video page
    unsafeWindow.location = unsafeWindow.location.href.replace('/info/', '/view/')
    return
  }

  if (url_path.indexOf('/view/') === 0) {
    // channel video page
    //   => start Intent w/ video stream URL
    var count = 15
    var timer = unsafeWindow.setInterval(
      function() {
        if (count <= 1) unsafeWindow.clearInterval(timer)
        if (count <= 0) return
        if (process_video_page((count === 1)))
          count = 0
        else
          count--
      },
      1000
    )
    return
  }

  if (url_path.indexOf('/channels') === 0) {
    // channels list page
    //   => load 200 free (not premium) channels
    process_channels_page()
    return
  }

  // fallback
  //   => redirect to channels list page
  unsafeWindow.location = unsafeWindow.location.protocol + '//www.streamlive.to/channels'
}

// =============================================================================

var process_video_page = function(show_error) {
  var hls_url = get_hls_url()

  if (hls_url) {
    var extras = ['referUrl', get_referer_url()]

    var args = [
      'android.intent.action.VIEW',  /* action */
      hls_url,                       /* data   */
      'application/x-mpegurl'        /* type   */
    ]

    for (var i=0; i < extras.length; i++) {
      args.push(extras[i])
    }

    GM_startIntent.apply(this, args)
  }
  else if (show_error) {
    GM_toastShort('video not found')
  }

  return (!!hls_url)
}

// =============================================================================

var get_hls_url = function() {
  var hls_url = null

  try {
    var sourcecode = document.querySelector('#container + script').innerText
    var pattern    = /source: ([a-z0-9_]+)\(\),/i
    var methodname = sourcecode.match(pattern)

    if (!methodname || (methodname.length < 2)) throw ''
    methodname = methodname[1]

    var method_fn = window[methodname]
    if (typeof method_fn !== 'function') throw ''

    hls_url = method_fn()
    if (!hls_url) throw ''

    if (hls_url[0] === '/')
      hls_url = unsafeWindow.location.protocol + hls_url
  }
  catch(e) {
    hls_url = null
  }

  return hls_url
}

// =============================================================================

var get_referer_url = function() {
  var referer_url
  try {
    referer_url = unsafeWindow.top.location.href
  }
  catch(e) {
    referer_url = unsafeWindow.location.href
  }
  return referer_url
}

// =============================================================================

var process_channels_page = function() {
  try {
    var $ = unsafeWindow.jQuery
    if (typeof $ !== 'function') throw ''

    {
      var $head = $('head')
      if ($head.length === 1)
        $head.empty()
    }

    var $body = $('body')
    if ($body.length !== 1) throw ''

    var results_max = 200
    var results_pp  = 8
    var request_num = Math.ceil(200/8)

    $body.empty()

    for (var page=1; page <= request_num; page++) {
      $.ajax({
        type:     'POST',
        dataType: 'html',
        url:      '/channelsPages.php',
        data: {
          "list":    'free',
          "itemspp": results_pp,
          "page":    page
        },
        success: function(html) {
          try {
            var $page_results = $('<div>' + html + '</div>')
            $page_results.find('nav').remove()
            $page_results.appendTo($body)
          }
          catch(e) {}
        }
      })
    }
  }
  catch(e) {}
}

// =============================================================================

init()
