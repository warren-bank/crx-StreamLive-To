// ==UserScript==
// @name         StreamLive To
// @description  Transfers video stream to alternate video players: WebCast-Reloaded, ExoAirPlayer.
// @version      0.2.1
// @match        *://streamlive.to/view/*
// @match        *://streamlive.to/channels
// @match        *://*.streamlive.to/view/*
// @match        *://*.streamlive.to/channels
// @icon         https://streamlive.to/favicon.ico
// @run-at       document-idle
// @homepage     https://github.com/warren-bank/crx-StreamLive-To/tree/greasemonkey-userscript
// @supportURL   https://github.com/warren-bank/crx-StreamLive-To/issues
// @downloadURL  https://github.com/warren-bank/crx-StreamLive-To/raw/greasemonkey-userscript/greasemonkey-userscript/StreamLive-To.user.js
// @updateURL    https://github.com/warren-bank/crx-StreamLive-To/raw/greasemonkey-userscript/greasemonkey-userscript/StreamLive-To.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var user_options = {
  "script_injection_delay_ms":    0,
  "redirect_to_webcast_reloaded": true,
  "force_http":                   true,
  "force_https":                  false,
  "filter_premium_channels":      true
}

var payload = function(){

  // ===========================================================================

  const process_video_page = function() {
    const get_video_src = function() {
      let sourcecode = document.querySelector('#container + script').innerHTML
      let pattern    = /source: ([a-z0-9_]+)\(\),/i
      let methodname = sourcecode.match(pattern)

      if (!methodname || (methodname.length < 2)) return null
      methodname = methodname[1]

      let method_fn = window[methodname]
      if (typeof method_fn !== 'function') return null

      let video_src = method_fn()
      if (!video_src) return null

      if (video_src[0] === '/')
        video_src = top.location.protocol + video_src

      return video_src
    }

    const get_referer_url = function() {
      let referer_url
      try {
        referer_url = top.location.href
      }
      catch(e) {
        referer_url = window.location.href
      }
      return referer_url
    }

    const get_webcast_reloaded_url = (hls_url, vtt_url, referer_url) => {
      let encoded_hls_url, encoded_vtt_url, encoded_referer_url, webcast_reloaded_base, webcast_reloaded_url

      encoded_hls_url       = encodeURIComponent(encodeURIComponent(btoa(hls_url)))
      encoded_vtt_url       = vtt_url ? encodeURIComponent(encodeURIComponent(btoa(vtt_url))) : null
      referer_url           = referer_url ? referer_url : get_referer_url()
      encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))

      webcast_reloaded_base = {
        "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
        "http":  "http://webcast-reloaded.surge.sh/index.html"
      }

      webcast_reloaded_base = (window.force_http)
                                ? webcast_reloaded_base.http
                                : (window.force_https)
                                   ? webcast_reloaded_base.https
                                   : (hls_url.toLowerCase().indexOf('http:') === 0)
                                      ? webcast_reloaded_base.http
                                      : webcast_reloaded_base.https

      webcast_reloaded_url  = webcast_reloaded_base + '#/watch/' + encoded_hls_url + (encoded_vtt_url ? ('/subtitle/' + encoded_vtt_url) : '') + '/referer/' + encoded_referer_url
      return webcast_reloaded_url
    }

    const redirect_to_url = function(url) {
      if (!url) return

      try {
        top.location = url
      }
      catch(e) {
        window.location = url
      }
    }

    const process_video_url = (hls_url) => {
      if (hls_url && window.redirect_to_webcast_reloaded) {
        // transfer video stream

        redirect_to_url(get_webcast_reloaded_url(hls_url))
      }
    }

    process_video_url(get_video_src())
  }

  // ===========================================================================

  const process_channels_page = function() {
    const $ = window.jQuery
    if (!$) return

    const channels_to_load = 200

    const filter_channels = function() {
      let channels = $('#loadChannels > div.ml-item')
      channels.each(function(i, el){
        let channel = $(el)
        let quality = channel.find('.mli-quality').text()
        if (quality === 'Premium') {
          channel.remove()
        }
        else {
          channel.find('a[href]').each(function(i,el) {
            el.href = el.href.replace('/info/', '/view/')
          })
        }
      })
    }

    window.loadChannel = function(){
      window.category = $("#category").val()
      window.language = $("#language").val()
      window.sortBy = $("#sortBy").val()
      window.query = $("#q").val()
      window.itempp = channels_to_load
      if("Find a channel"==query) {
          query = ""
      }
      $("#loadChannels").load(
        "/channelsPages.php",
        {
          "page": window.page,
          "category": window.category,
          "language": window.language,
          "sortBy": window.sortBy,
          "query": window.query,
          "list": window.list,
          "itemspp": window.itempp
        },
        filter_channels
      )
    }

    $(document).ready(function(){
      try {
        window.page = 1
        window.loadChannel()
      }
      catch(e){}
    })
  }

  // ===========================================================================

  const url_path = window.location.pathname.toLowerCase()

  if (url_path.indexOf('/view/') === 0) {
    // video page
    if (window.redirect_to_webcast_reloaded)
      process_video_page()
  }

  if (url_path.indexOf('/channels') === 0) {
    // channels page
    if (window.filter_premium_channels)
      process_channels_page()
  }
}

var get_hash_code = function(str){
  var hash, i, char
  hash = 0
  if (str.length == 0) {
    return hash
  }
  for (i = 0; i < str.length; i++) {
    char = str.charCodeAt(i)
    hash = ((hash<<5)-hash)+char
    hash = hash & hash  // Convert to 32bit integer
  }
  return Math.abs(hash)
}

var inject_function = function(_function){
  var inline, script, head

  inline = _function.toString()
  inline = '(' + inline + ')()' + '; //# sourceURL=crx_extension.' + get_hash_code(inline)
  inline = document.createTextNode(inline)

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.head
  head.appendChild(script)
}

var inject_options = function(){
  var _function = `function(){
    window.redirect_to_webcast_reloaded = ${user_options['redirect_to_webcast_reloaded']}
    window.force_http                   = ${user_options['force_http']}
    window.force_https                  = ${user_options['force_https']}
    window.filter_premium_channels      = ${user_options['filter_premium_channels']}
  }`
  inject_function(_function)
}

var bootstrap = function(){
  inject_options()
  inject_function(payload)
}

setTimeout(
  bootstrap,
  user_options['script_injection_delay_ms']
)
