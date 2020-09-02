// ==UserScript==
// @name         StreamLive To
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://streamlive.to/*
// @match        *://*.streamlive.to/*
// @icon         https://streamlive.to/favicon.ico
// @run-at       document-end
// @homepage     https://github.com/warren-bank/crx-StreamLive-To/tree/webmonkey-userscript/es6
// @supportURL   https://github.com/warren-bank/crx-StreamLive-To/issues
// @downloadURL  https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es6/webmonkey-userscript/StreamLive-To.user.js
// @updateURL    https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es6/webmonkey-userscript/StreamLive-To.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// =============================================================================

const init = () => {
  const url_path = unsafeWindow.location.pathname.toLowerCase()

  if (url_path.indexOf('/info/') === 0) {
    // channel info page
    //   => redirect to channel video page
    unsafeWindow.location = unsafeWindow.location.href.replace('/info/', '/view/')
    return
  }

  if (url_path.indexOf('/view/') === 0) {
    // channel video page
    //   => start Intent w/ video stream URL
    let count = 15
    let timer = unsafeWindow.setInterval(
      () => {
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

const process_video_page = (show_error) => {
  const hls_url = get_hls_url()

  if (hls_url) {
    const extras = ['referUrl', get_referer_url()]

    GM_startIntent(/* action= */ 'android.intent.action.VIEW', /* data= */ hls_url, /* type= */ 'application/x-mpegurl', /* extras: */ ...extras)
  }
  else if (show_error) {
    GM_toastShort('video not found')
  }

  return (!!hls_url)
}

// =============================================================================

const get_hls_url = function() {
  let hls_url = null

  try {
    let sourcecode = document.querySelector('#container + script').innerHTML
    let pattern    = /source: ([a-z0-9_]+)\(\),/i
    let methodname = sourcecode.match(pattern)

    if (!methodname || (methodname.length < 2)) throw ''
    methodname = methodname[1]

    let method_fn = window[methodname]
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

const get_referer_url = () => {
  let referer_url
  try {
    referer_url = unsafeWindow.top.location.href
  }
  catch(e) {
    referer_url = unsafeWindow.location.href
  }
  return referer_url
}

// =============================================================================

const process_channels_page = () => {
  try {
    const $ = unsafeWindow.jQuery
    if (typeof $ !== 'function') throw ''

    {
      const $head = $('head')
      if ($head.length === 1)
        $head.empty()
    }

    const $body = $('body')
    if ($body.length !== 1) throw ''

    const results_max = 200
    const results_pp  = 8
    const request_num = Math.ceil(200/8)

    $body.empty()

    for (let page=1; page <= request_num; page++) {
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
            const $page_results = $('<div>' + html + '</div>')
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
