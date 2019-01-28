// https://www.streamlive.to/channels

jQuery(document).ready(function($){
  let data = []
  let $a = $('div#loadChannels > div.ml-item > a.ml-mask[href][title]')

  $a.each(function(){
    let href = this.href
    let name = this.title

    data.push([href,name])
  })

  let name_pattern = /\((?:SD|HD)\)/i
  data = data.filter(([href,name]) => {
    return name_pattern.test(name)
  })

  data.sort(function(a, b){
    let nameA = a[1].toLowerCase()
    let nameB = b[1].toLowerCase()
    return (nameA < nameB)
      ? -1
      : (nameA > nameB)
        ? 1
        : 0
  })

  let md   = ''
  let html = ''
  let i

  for (i=0; i<data.length; i++) {
    let href = data[i][0]
    let name = data[i][1]

    md   += `  * [${name}](${href})\n`
    html += `                <li><a href="${href}">${name}</a>\n`
  }

  console.log("\n----------------------------------------\n")
  console.log('md:')
  console.log(md)
  console.log("\n----------------------------------------\n")
  console.log('html:')
  console.log(html)
  console.log("\n----------------------------------------\n")
})
