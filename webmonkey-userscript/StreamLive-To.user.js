// ==UserScript==
// @name         StreamLive To
// @description  Watch videos in external player.
// @version      2.1.0
// @match        *://streamlive.to/*
// @match        *://*.streamlive.to/*
// @icon         https://streamlive.to/favicon.ico
// @run-at       document-end
// @grant        unsafeWindow
// @homepage     https://github.com/warren-bank/crx-StreamLive-To/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-StreamLive-To/issues
// @downloadURL  https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es5/webmonkey-userscript/StreamLive-To.user.js
// @updateURL    https://github.com/warren-bank/crx-StreamLive-To/raw/webmonkey-userscript/es5/webmonkey-userscript/StreamLive-To.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "common": {
    "show_user_notifications":      true,
    "filter_premium_channels":      true,
    "redirect_to_channels":         true,
    "init_delay_ms":                1000
  },
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, vtt_url, referer_url, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.surge.sh/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_video_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var redirect_to_url = function(url) {
  if (!url) return

  if (typeof GM_loadUrl === 'function') {
    if (typeof GM_resolveUrl === 'function')
      url = GM_resolveUrl(url, unsafeWindow.location.href) || url

    GM_loadUrl(url, 'Referer', unsafeWindow.location.href)
  }
  else {
    try {
      unsafeWindow.top.location = url
    }
    catch(e) {
      unsafeWindow.window.location = url
    }
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_url = function(video_url, video_type, vtt_url, referer_url) {
  if (!referer_url)
    referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ video_url,
      /* type   = */ video_type
    ]

    // extras:
    if (vtt_url) {
      args.push('textUrl')
      args.push(vtt_url)
    }
    if (referer_url) {
      args.push('referUrl')
      args.push(referer_url)
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(video_url, vtt_url, referer_url))
    return true
  }
  else {
    return false
  }
}

var process_hls_url = function(hls_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ hls_url, /* video_type= */ 'application/x-mpegurl', vtt_url, referer_url)
}

var process_dash_url = function(dash_url, vtt_url, referer_url) {
  process_video_url(/* video_url= */ dash_url, /* video_type= */ 'application/dash+xml', vtt_url, referer_url)
}

// ----------------------------------------------------------------------------- user notifications

var show_user_notification = function(message) {
  if (user_options.common.show_user_notifications) {
    if (typeof GM_toastShort === 'function')
      GM_toastShort(message)
    else
      unsafeWindow.alert(message)
  }
}

// ----------------------------------------------------------------------------- process window

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
    if (user_options.common.filter_premium_channels) {
      // channels list page
      //   => load 200 free (not premium) channels
      process_channels_page()
    }
    return
  }

  if (url_path.indexOf('/search/') === 0) {
    return
  }

  if (user_options.common.redirect_to_channels) {
    // fallback
    //   => redirect to channels list page
    unsafeWindow.location = unsafeWindow.location.protocol + '//www.streamlive.to/channels'
  }
}

// =============================================================================

var process_video_page = function(show_error) {
  var hls_url = get_hls_url()

  if (hls_url) {
    process_hls_url(hls_url)
  }
  else if (show_error) {
    show_user_notification('video not found')
  }

  return (!!hls_url)
}

// =============================================================================

var get_hls_url = function() {
  var hls_url = null

  try {
    var sourcecode = unsafeWindow.document.querySelector('#container + script').innerText
    var pattern    = /source: ([a-z0-9_]+)\(\),/i
    var methodname = sourcecode.match(pattern)

    if (!methodname || (methodname.length < 2)) throw ''
    methodname = methodname[1]

    var method_fn = unsafeWindow[methodname]
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
    var $form = $('form#search').first().detach()
    if ($body.length !== 1) throw ''

    var results_max = 200
    var results_pp  = 8
    var request_num = Math.ceil(200/8)

    $body.empty()

    if ($form.length === 1) {
      $form.off()
      $form.find('> div > *').css({'float': 'left'})
      $form.find('> div').append(
        $('<div></div>').css({'width': '100%', 'height': '4px', 'clear': 'both'})
      )
      $form.find('input').off()
      $form.find('button#formSearch').text('Search').off()

      $body.append($form)
    }

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
            $page_results.find('div.ml-item').css({'float': 'left', 'padding': '2px', 'border': '1px solid black', 'width': '320px', 'height': '275px', 'overflow': 'hidden'})
            $page_results.find('div.ml-item a img').css({'width': '320px', 'height': '180px'})
            $page_results.appendTo($body)
          }
          catch(e) {}
        }
      })
    }
  }
  catch(e) {}
}

// ----------------------------------------------------------------------------- bootstrap

setTimeout(
  init,
  user_options.common.init_delay_ms
)
