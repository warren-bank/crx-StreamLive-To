const payload_channels = function() {
  const $ = window.jQuery
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
    window.page = 1
    window.loadChannel()
  })
}

const payload_view = function(){
  /*
   * docs:
   * =====
   *   https://github.com/clappr/clappr
   *   https://github.com/Novage/p2p-media-loader
   *   https://github.com/Novage/p2p-media-loader/tree/master/p2p-media-loader-hlsjs#p2p-media-loader---hlsjs-integration
   */

  const do_error = function() {
    let msg = 'cannot determine video source'
    console.log(msg)
    throw new Error(msg)
  }

  const get_video_src = function() {
    let sourcecode = document.querySelector('#container + script').innerHTML
    let pattern    = /source: ([a-z0-9_]+)\(\),/i
    let methodname = sourcecode.match(pattern)

    if (!methodname || (methodname.length < 2)) do_error()
    methodname = methodname[1]

    let method_fn = window[methodname]
    if (typeof method_fn !== 'function') do_error()

    let video_src = method_fn()
    if (!video_src) do_error()

    return video_src
  }

  const get_new_js = function() {
    let new_js    = {}
    let video_src = get_video_src()

    console.clear()
    console.log('HLS video source:', video_src)

    // ---------------------------------------------
    new_js['initialize_video_player'] = function() {
      var player

      if (p2pml.hlsjs.Engine.isSupported()) {
        var engine = new p2pml.hlsjs.Engine();
        player = new Clappr.Player({
            parentId: "#container",
            width: "100%",
            height: "100%",
            source: video_src,
            mute: false,
            autoPlay: true,
            playback: {
             hlsjsConfig: {
                  liveSyncDurationCount: 7,
                  loader: engine.createLoaderClass()
              }
           }
        });

        function resizePlayer(){
          let body_height = document.body.clientHeight
          let container   = document.querySelector('body > div > div#container > div[data-player]')

          container.style.height = body_height + 'px !important'
        }

        resizePlayer();
        window.onresize = resizePlayer;

        p2pml.hlsjs.initClapprPlayer(player);
      } else {
          document.write("Not supported :(");
      }
    }
    // ---------------------------------------------
    /*
     ******************
     * helper function:
     *   - needs to be called from Chrome DevTools console
     *     * Console Utilities API: getEventListeners()
     *         https://developers.google.com/web/tools/chrome-devtools/console/utilities#geteventlistenersobject
     *   - usage:
     *         removeEventListeners(window, ['mousedown']) || console.log('warning: unable to removeEventListeners')
     ******************
     */
    new_js['removeEventListeners'] = function(target, types=['blur','change','click','contextmenu','dblclick','error','focus','focusin','focusout','keydown','keypress','keyup','load','mousedown','mouseenter','mouseleave','mousemove','mouseout','mouseover','mouseup','resize','scroll','select','submit','unload']) {
      // sanity checks
      if (!target || !Array.isArray(types)) return false
      if (!(
        (target instanceof HTMLElement) || (target === window) || (target === document)
      )) return false
      if (!window.getEventListeners) return false
      if (!target.removeEventListener) return false

      let listeners = window.getEventListeners(target) || {}

      types.forEach(type => {
        let events = listeners[type]
        if (Array.isArray(events)) {
          events.forEach(e => {
            let {listener, useCapture} = e
            target.removeEventListener(type, listener, useCapture)
          })
        }
      })

      return true
    }
    // ---------------------------------------------

    return new_js
  }

  const get_new_head = function() {
    let old_style   = [...document.querySelectorAll('style')].map(el => el.outerHTML).join("\n")
    let body_height = document.body.clientHeight

    let new_head = `
      <script src="https://cdn.jsdelivr.net/npm/p2p-media-loader-core@latest/build/p2p-media-loader-core.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/p2p-media-loader-hlsjs@latest/build/p2p-media-loader-hlsjs.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/clappr@latest"></script>

      ${old_style || ''}

      <style>
        body > div[class] {display: none !important;}
      </style>
`
    return new_head
  }

  const get_new_html = function() {
    let new_html  = `
      <div>
        <div id="container"></div>
      </div>
`
    return new_html
  }

  const poll_for_ready = function() {
    if (window.Clappr && window.p2pml && window.p2pml.hlsjs && window.initialize_video_player){
      initialize_video_player()
    }
    else {
      setTimeout(poll_for_ready, 100)
    }
  }

  const update_page_html = function() {
    let new_js = get_new_js()

    document.head.innerHTML = get_new_head()
    document.body.innerHTML = get_new_html()

    for (fn in new_js) {
      window[fn] = new_js[fn]
    }

    poll_for_ready()
  }

  update_page_html()
}

const get_payload = function() {
  const payload = (window.location.pathname === '/channels')
    ? payload_channels
    : payload_view

  return payload
}

const inject_function = function(_function){
  let inline, script, head

  inline = document.createTextNode(
    '(' + _function.toString() + ')()'
  )

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.head
  head.appendChild(script)
}

if (document.readyState === 'complete'){
  let payload = get_payload()
  inject_function(payload)
}
else {
  document.addEventListener("DOMContentLoaded", function(event) {
    let payload = get_payload()
    inject_function(payload)
  })
}
