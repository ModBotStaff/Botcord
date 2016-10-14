/*
* Welcome to Botcord Public Alpha Testing for Patch 1.0
* Please keep in mind this is still a work in progress,
* many things can be broken, all I'm asking you, is to report
* non-found bugs, to see list of found bugs, check out the
* Team Cernodile server, #bugs channel.
*
* Happy testing,
* Cernodile
*/
var avatarHashes = [
  "6debd47ed13483642cf09e832ed0bc1b",
  "322c936a8c8be1b803cd94861bdfa868",
  "dd4dbc0016779df1378e7812eabaa04d",
  "0e291f67c9274a1abdddeb3fd919cbaa",
  "1cbd08c76f8af6dddce02c5138971129"
]
var activeChannel = '0'
var token = ''
var currentGuildMembers
var activeGuild
var converter = new showdown.Converter()
converter.setOption('headerLevelStart', '10');
converter.setOption('strikethrough', true);
function startBotcord (formdata) {
  var script = document.createElement('script')
  script.src = './jscord.js'
  script.charset = 'utf-8'
  document.head.appendChild(script)
  script.onload = function () {
    login(formdata.trim())
    readyHandler = function (payload) {
      localStorage.token = token
      if (!localStorage.theme) localStorage.theme = 'dark'
      $('body').attr('class', 'theme-' + localStorage.theme)
      $('body').attr('style', '')
      var dom = "<div class='flex-vertical flex-spacer'><section class='flex-horizontal flex-spacer'><div class='guilds'><div class='guild'><a draggable='false' style='background-color: rgb(46, 49, 54);' onclick='goDMs()' class='avatar'>DM</a></div></div><div class='flex-vertical channels-wrap'><div class='flex-vertical flex-spacer'><div class='guild-header'><header><span>Loading...</span></header></div><div class='channels'></div><div class='account'></div></div></div><div class='chat flex-vertical flex-spacer'><div class='title-wrap'><div class='title'><span class='channel'>Loading...</span></div><span class='topic'>Loading...</span></div><div class='messages-container'></div><form id='message'><div class='textarea'><div class='textarea-inner'><div class='channel-textarea-upload'><div class='file-input' style='position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; opacity: 0; cursor: pointer;'></div></div><textarea id='textarea' rows='1' placeholder='Chat using Botcord...' style='height: auto; overflow: hidden;'></textarea></div></div></form></div></section></div><input id='file-input' name='file' type='file' style='position:absolute;width:0px;height:0px;visibility:hidden;'/>"
      document.body.innerHTML = dom
      goDMs()
      $("#textarea").keypress(function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code === 13 && !e.shiftKey) {
          parseCmd($('#textarea').val())
          $('#textarea').val('').blur()
        }
      })
      $('.file-input').click(function() {
        $('#file-input').click()
      })
      document.getElementById('file-input').addEventListener("change", function() {
        var formdat = new FormData()
        var file = document.getElementById('file-input').files[0]
        formdat.append('file', file, file.name)
        uploadFile(activeChannel, formdat)
      })
      var avatar = 'https://cdn.discordapp.com/avatars/' + bot.user.id + '/' + bot.user.avatar + '.jpg'
      if (bot.user.avatar === null) avatar = 'https://discordapp.com/assets/' + avatarHashes[bot.user.discriminator % avatarHashes.length] + '.png'
      var bottag = ''
      if (bot.user.bot) bottag = '<span class="bot-tag">BOT</span>'
      $('.account').append('<div class="avatar-small" style="background: url(\'' + avatar + '\');background-size: 30px 30px;"></div><div class="account-details"><div class="username">' + bot.user.username + bottag + '</div><div class="discriminator">#' + bot.user.discriminator + '</div></div><div class="leave">-></div>')
    }
    guildHandler = function (payload) {
      var guild = payload.detail
      var guildVar
      guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background-color: rgb(46, 49, 54);" class="avatar">' + guild.name.match(/\b\w/g).join('') + '</a></div>'
      if (guild.icon) guildVar = '<div class="guild" data-guild="' + guild.id + '"><a draggable="false" onclick="switchGuild(\'' + guild.id + '\')" style="background: url(\'https://cdn.discordapp.com/icons/' + guild.id + '/' + guild.icon + '.jpg\');background-size: 50px 50px;" class="avatar-small"></a></div>'
      $('.guilds').append(guildVar)
    }
    msgHandler = function (msg) {newMsg(msg.detail)}
    msgEditHandler = function (msg) {editMsg(msg.detail)}
    msgDelHandler = function (msg) {deleteMsg(msg.detail)}
    msgDelBulkHandler = function (msg) {for (var i in msg.detail.ids) {deleteMsg(msg.detail.ids[i])}}
    presenceHandler = function (payload) {
      var memberData = payload.detail
      if (activeGuild === 'dm') {
        var users = $('.channels').children()
        for (var a in users) {
          if (users[a].childNodes !== undefined) {
            if (users[a].childNodes[0].dataset.dmuid === memberData.user.id) {
              if (memberData.game && !$(users[a].childNodes[0].childNodes[1].childNodes[1]).html().includes('<span>Playing<strong>')) $(users[a].childNodes[0].childNodes[1].childNodes[1]).append('<span>Playing<strong>' + memberData.game.name + '</strong></span>')
              users[a].childNodes[0].childNodes[0].childNodes[0].className = 'status ' + memberData.status
            }
          }
        }
      }
    }
  }
}
function switchGuild (id) {
  var guild = bot.guilds.get(id)
  $('.messages-container').empty()
  $('.title-wrap').empty()
  $('.channels').empty()
  $('.guild-header').empty()
  $('.guild-header').append('<header><span>' + guild.name + '</span></header>')
  activeGuild = guild.id
  var guildChannels = []
  guild.channels.forEach((channel) => {
    if (channel.id === guild.id) return guildChannels.push(channel)
    if (guild.members.get(bot.user.id).permissions['administrator']) return guildChannels.push(channel)
    if (channel.permissions.length > 0) {
      for (var i in channel.permissions) {
        if (channel.permissions[i].type === 'role') {
          if (channel.permissions[i].id === guild.id) {
            var channelpermss = getPerm(channel.permissions[i].deny)
            if (channelpermss.length === 0) return guildChannels.push(channel)
            var check = ''
            for (var d in channelpermss) {
              if (channelpermss[d].name === 'readMessages') check = 'readMessages'
            }
            if (check !== 'readMessages') return guildChannels.push(channel)
          }
          if (guild.members.get(bot.user.id).roles.length > 0 && channel.permissions[i].id !== guild.id) {
            if (guild.members.get(bot.user.id).roles.indexOf(channel.permissions[i].id) > -1 || guild.members.get(bot.user.id).permissions['readMessages']) {
              var channelpermss = getPerm(channel.permissions[i].deny)
              if (channel.permissions[i].deny === 0) return guildChannels.push(channel)
              var check = ''
              for (var d in channelpermss) {
                if (channelpermss[d].name === 'readMessages') check = 'readMessages'
              }
              if (check !== 'readMessages') return guildChannels.push(channel)
            } else {
            }
          }
        } else {
          if (channel.permissions[i].id === bot.user.id) {
          }
        }
      }
    } else guildChannels.push(channel)
  })
  guildChannels = guildChannels.sort(function (a, b) {return a.position - b.position})
  for (var i in guildChannels) {
    if (guildChannels[i].id === guild.id) switchChannel(guild.id, guildChannels[i].name)
    if (guildChannels[i].type === 0) $('.channels').append('<div class="channel" data-channel="' + guildChannels[i].id + '"><a draggable="false" onclick="switchChannel(\'' + guildChannels[i].id + '\', \'' + guildChannels[i].name + '\')" class="channel">' + guildChannels[i].name + '</a></div></div>')
  }
}
function goDMs () {
  var dms = bot.privateChannels
  $('.title-wrap').empty()
  $(".messages-container").empty();
  $(".channels").empty();
  $('.guild-header').empty()
  $('.guild-header').append('<header><span>Direct Messages</span></header>')
  activeGuild = 'dm'
  activeChannel = 'dm'
  document.getElementById('textarea').disabled = true
  document.getElementById('textarea').placeholder = 'You cannot send messages to thin air!'
  var d = []
  dms.forEach((dm) => {
    d.push(dm)
  })
  d = d.sort(function (a, b) {return parseInt(a.last_message_id) - parseInt(b.last_message_id)}).reverse()
  for (var i in d) {
    var status = 'offline'
    var game = ''
    if (bot.users.has(d[i].recipients[0].id)) {
      status = bot.users.get(d[i].recipients[0].id).status
      if (bot.users.get(d[i].recipients[0].id).game) game = '<span>Playing<strong>' + bot.users.get(d[i].recipients[0].id).game.name + '</strong></span>'
    }
    if (status === null || status === undefined) status = 'offline'
    var avatar = 'https://cdn.discordapp.com/avatars/' + d[i].recipients[0].id + '/' + d[i].recipients[0].avatar + '.jpg'
    if (d[i].recipients[0].avatar === null) avatar = 'https://discordapp.com/assets/' + avatarHashes[d[i].recipients[0].id % avatarHashes.length] + '.png'
    if (d[i].recipients.length === 1) $('.channels').append('<div class="channel dm"><a data-dmuid="' + d[i].recipients[0].id + '" onclick="switchChannel(\'' + d[i].id + '\', \'' + d[i].recipients[0].username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '\')" draggable="false"><div style="background-image: url(\'' + avatar + '\')" class="avatar-small-dm"><div class="status ' + status + '"></div></div><div class="dm-user">' + d[i].recipients[0].username + '<div class="channel-activity">' + game + '</div></div></a></div>')
  }
}
function switchChannel (id, name) {
  apiCall('GET', 'https://discordapp.com/api/v6/channels/' + id + '/messages', true, {authorization: token, body: {limit: 75}}).then((msgs) => {
    if ($(document.querySelector('[data-channel="' + activeChannel + '"]'))[0]) $(document.querySelector('[data-channel="' + activeChannel + '"]'))[0].className = 'channel'
    activeChannel = id
    document.getElementById('textarea').disabled = false
    if (bot.channels.has(id)) document.getElementById('textarea').placeholder = 'Message #' + name + '...'
    else document.getElementById('textarea').placeholder = 'Message @' + name + '...'
    if ($(document.querySelector('[data-channel="' + id + '"]'))[0]) $(document.querySelector('[data-channel="' + id + '"]'))[0].className = 'channel selected'
    $('.title-wrap').empty()
    $('.title-wrap').append('<div class="title"><span class="channel">' + name + '</span></div>')
    $('.messages-container').empty()
    msgs = msgs.reverse()
    for (var i in msgs) {
        var msgObj = {}
        msgObj.content = msgs[i].content
        msgObj.author = msgs[i].author
        msgObj.id = msgs[i].id
        msgObj.edited = msgs[i].edited_timestamp
        msgObj.embeds = msgs[i].embeds
        msgObj.attachments = msgs[i].attachments
        msgObj.mentions = msgs[i].mentions
        msgObj.timestamp = msgs[i].timestamp
        msgObj.type = msgs[i].type
        msgObj.webhook = msgs[i].webhook_id || 0
        if (bot.channels.has(msgs[i].channel_id)) {
          msgObj.channel = bot.channels.get(msgs[i].channel_id)
          msgObj.member = msgObj.channel.guild.members.get(msgObj.author.id)
        }
      newMsg(msgObj)
    }
  }).catch((e) => {
    activeChannel = id
    document.getElementById('textarea').disabled = false
    if (bot.channels.has(id)) document.getElementById('textarea').placeholder = 'Message #' + name + '...'
    else document.getElementById('textarea').placeholder = 'Message @' + name + '...'
    if ($(document.querySelector('[data-channel="' + id + '"]'))[0]) $(document.querySelector('[data-channel="' + id + '"]'))[0].className = 'channel selected error'
    $('.title-wrap').empty()
    $('.title-wrap').append('<div class="title"><span class="channel">' + name + '</span></div>')
    $('.messages-container').empty()
    $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(255, 0, 0, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + Date.now() + '" class="markup"><p><strong>You do not have permission to read messages (history) in this channel!</strong></p></span></div></div></div></div>'))
  })
}
function openDMchannel (id) {
  if (!bot.privateChannels.has(id)) {
    createDMchannel(id).then((r) => {
      var privateChannelData = {
        id: r.id,
        last_message_id: r.last_message_id,
        recipients: [r.recipient],
        type: 1
      }
      bot.privateChannels.set(r.id, privateChannelData)
      goDMs()
      switchChannel(r.id, r.recipient.username)
    })
  } else {
    goDMs()
    switchChannel(id, bot.users.get(id).username)
  }
}
function deleteMsg (msg) {
  var d = $(document.querySelector('[data-id="' + msg.id + '"]'))
  if (d[0] && msg.channel_id === activeChannel) {
    if (d.parents()[0].childNodes.length === 1) {
      d.parents()[3].remove()
    } else d[0].remove()
  }
}
function editMsg (msg) {
  var d = $(document.querySelector('[data-id="' + msg.id + '"]'))
  if (d[0]) {
    d[0].innerHTML = converter.makeHtml(antixss(msg))
  }
}
function newMsg (msg) {
  var avatar = 'https://cdn.discordapp.com/avatars/' + msg.author.id + '/' + msg.author.avatar + '.jpg'
  var bot = ''
  if (msg.author.avatar === null) avatar = 'https://discordapp.com/assets/' + avatarHashes[msg.author.discriminator % avatarHashes.length] + '.png'
  if (msg.author.bot) bot = '<span class="bot-tag">Bot</span>'
  var username = '<span class="username" onclick="openDMchannel(\'' + msg.author.id + '\')">' + msg.author.username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot
  if (msg.member) {
    var name = msg.author.username
    var realName = ''
    if (msg.member.nick) {
      username = '<span class="username" onclick="openDMchannel(\'' + msg.author.id + '\')">' + msg.member.nick.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot
      name = msg.member.nick
      realName = '<span class="timestamp">' + msg.author.username.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '#' + msg.author.discriminator + '</span>'
    }
    msg.member.color = ''
    if (msg.member.roles) {
      var temp = []
      msg.channel.guild.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var i in temp) {
        if (temp[i].color !== '0') {
          if (temp[i].color.length === 4) temp[i].color = '00' + temp[i].color
          if (temp[i].color.length === 5) temp[i].color = '0' + temp[i].color
          if (msg.member.roles.indexOf(temp[i].id) > -1) {
            username = '<span class="username" onclick="openDMchannel(\'' + msg.author.id + '\')" style="color:#' + temp[i].color + '">' + name.replace(/</ig, '&lt;').replace(/>/ig, '&gt;') + '</span>' + bot + realName
            msg.member.color = temp[i].color
          }
        }
      }
    }
  }
  if (msg.type === 6) {
    msg.content = '<p><span class="username" style="color:#' + msg.member.color + '">' + name + '</span> pinned a message to this channel. <strong>See all the pins.</strong> <span data-timestamp="' + msg.timestamp + '" class="timestamp">' + moment(msg.timestamp).calendar() + '</span><p>'
    var parsedMsg = $('<div class="msg-group" style="padding: 15px 0;">').append('<div class="message"><div class="comment" data-uid="' + msg.author.id + '" style="margin-left: 20px;"><div class="message-text"><span data-id="' + msg.id + '" class="markup">' + msg.content + '</span></div></div></div></div>')
    return $('.messages-container').append(parsedMsg)
  }
  if (msg.type !== 6) var parsedMsg = $('<div class="msg-group">').append('<div class="message"><div class="avatar-large" style="background-image: url(\'' + avatar + '\');"></div><div class="comment" data-uid="' + msg.author.id + '"><h2><span class="username-wrap">' + username + '</strong></span><span data-timestamp="' + msg.timestamp + '" class="timestamp">' + moment(msg.timestamp).calendar() + '</span></h2><div class="message-text"><span data-id="' + msg.id + '" class="markup">' + converter.makeHtml(antixss(msg)) + '</span></div></div></div></div>')
  var d = $(document.querySelector('[data-uid="' + msg.author.id + '"]')).parents()
    if (d[2] !== undefined) {
      var day = moment(msg.timestamp).format('hh-DDMMYY').split('-')
      var lastTimestamp = moment(d[2].lastChild.firstChild.lastChild.firstChild.lastChild.dataset.timestamp).format('hh-DDMMYY').split('-')
      if (d[2].lastChild.firstChild.lastChild.dataset.uid === msg.author.id && day[0] === lastTimestamp[0] && day[1] === lastTimestamp[1]) {
        $(d[2].lastChild.firstChild.lastChild.lastChild).append('<span data-id="' + msg.id + '" class="markup">' + converter.makeHtml(antixss(msg)) + '</span>')
        return $('.messages-container').scrollTop($('.messages-container').scrollTop() + $('.chat').children()[1].lastChild.lastChild.lastChild.clientHeight + 10)
      } else return $('.messages-container').append(parsedMsg)
    }
  if (d[2] === undefined) {
    $('.messages-container').append(parsedMsg)
    return $('.messages-container').scrollTop($('.messages-container').scrollTop() + $('.chat').children()[1].lastChild.clientHeight)
  }
}
function antixss (msg) {
  var edit = ''
  var attachEnd = ''
  if (msg.embeds[0] || msg.attachments[0]) attachEnd = '<div class="accessory">'
  if (msg.editedTimestamp) edit = '<span class="edited">(edited)</span>'
  function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
    ratio = Math.min(ratio[0], ratio[1]);
    return { width:srcWidth*ratio, height:srcHeight*ratio };
  }
  if (msg.edited !== null) edit = '<span class="edited">(edited)</span>'
  if (msg.embeds[0] !== undefined) {
    if (msg.embeds[0].thumbnail) {
      var dimensions = calculateAspectRatioFit(msg.embeds[0].thumbnail.width, msg.embeds[0].thumbnail.height, 400, 600)
      if (msg.embeds[0].thumbnail.width < 400) msg.embeds[0].thumbnail.width = Math.round(msg.embeds[0].thumbnail.width / 1.035)
      else msg.embeds[0].thumbnail.width = dimensions.width
    }
    var provider = ''
    if (msg.embeds[0].provider) provider = '<div class="embed-provider">' + msg.embeds[0].provider.name + '</div>'
    if (msg.embeds[0].type === 'image') attachEnd = attachEnd + '<div class="embed"><img src="' + msg.embeds[0].thumbnail.proxy_url + '" href="' + msg.embeds[0].thumbnail.url + '" width="' + msg.embeds[0].thumbnail.width +  '" height="auto"></div>'
    if (msg.embeds[0].type === 'video') attachEnd = attachEnd + '<div class="embed"><img src="' + msg.embeds[0].thumbnail.proxy_url + '" href="' + msg.embeds[0].thumbnail.url + '" width="' + msg.embeds[0].thumbnail.width +  '" height="auto"></div>'
    if (msg.embeds[0].type === 'link') {
      if (msg.embeds[0].description)attachEnd = attachEnd + '<div class="embed"><div class="embed-description">' + msg.embeds[0].description + '</div></div>'
    }
    if (msg.embeds[0].type === 'article') {
      if (msg.embeds[0].description) attachEnd = attachEnd + '<div class="embed">' + provider + '<div class="embed-description">' + msg.embeds[0].description + '</div></div>'
    }
    if (msg.embeds[0].type === 'rich') {
      var embData = []
      if (msg.embeds[0].author) {
        embData.push('<div>')
        if (msg.embeds[0].author.icon_url) embData.push('<img class="embed-author-icon" src="' + msg.embeds[0].author.icon_url + '"/>')
        if (msg.embeds[0].author.name) embData.push('<a class="embed-author" target="_blank" rel="noreferrer">' + msg.embeds[0].author.name + '</a>')
        embData.push('</div>')
      }
      if (msg.embeds[0].title) embData.push('<div><a class="embed-title" target="_blank" rel="noreferrer">' + msg.embeds[0].title + '</a></div>')
      if (msg.embeds[0].description) embData.push('<div class="embed-description markup">'+ converter.makeHtml(msg.embeds[0].description.replace(/>/ig, '&gt;').replace(/</ig, '&lt;').replace(/-/ig, '&#45;').replace(/\+/ig, '&#45;')) + '</div>')
      if (msg.embeds[0].fields) embData.push('<div class="embed-fields">')
      for (var i in msg.embeds[0].fields) {
        var inline = ''
        if (msg.embeds[0].fields[i].inline) inline = '-inline'
        embData.push('<div class="embed-field embed-field' + inline + '"><div class="embed-field-name">' + msg.embeds[0].fields[i].name + '</div><div class="embed-field-value markup">' + msg.embeds[0].fields[i].value.replace(/\-/ig, '&#45;').replace(/\+/ig, '&#45;').replace(/</, '&lt;').replace(/>/, '&gt;').replace(/\n+/ig, '<br>').replace(/https?:\/\/[\S]*/ig, function (m, r) {return m.replace(m, '<a href="' + m + '">' + m + '</a>')}).replace(/[\s\S]+/, function (m) {return twemoji.parse(m)}) + '</div></div>')
      }
      if (msg.embeds[0].fields) embData.push('</div>')
      if (msg.embeds[0].footer) {
        embData.push('<div>')
        if (msg.embeds[0].footer.icon_url) embData.push('<img class="embed-footer-icon" src="' + msg.embeds[0].footer.icon_url + '"/>')
        if (msg.embeds[0].footer.text) embData.push('<span class="embed-footer">' + msg.embeds[0].footer.text.replace(/\n+/ig, '<br>') + '</span>')
        embData.push('</div>')
      }
      attachEnd = attachEnd + '<div class="embed" style="border-left-color: #' + msg.embeds[0].color.toString(16) + '">' + embData.join('') + '</div>'
    }
  }
  if (msg.attachments[0] !== undefined) {
    if (msg.attachments[0].width) {
      var dimensions = calculateAspectRatioFit(msg.attachments[0].width, msg.attachments[0].height, 400, 600)
      var width = dimensions.width
      if (msg.attachments[0].width < 400) width = Math.round(msg.attachments[0].width / 1.035)
      attachEnd += '<img src="' + msg.attachments[0].proxy_url + '" href="' + msg.attachments[0].url + '" alt="' + msg.attachments[0].filename + '" width="' + width + '" height="auto"/>'
    } else {
      function humanFileSize (size) {
        if (size === 0) return '0 bytes'
        var i = Math.floor( Math.log(size) / Math.log(1024) );
        return ( size / Math.pow(1024, i) ).toFixed(2) * 1 + ' ' + ['bytes', 'kB', 'MB', 'GB', 'TB'][i];
      }
      attachEnd += '<div class="attachment"><div class="icon icon-file document"></div><a href="" target="_blank" rel="noreferrer">' + msg.attachments[0].filename + '</a><div class="metadata">' + humanFileSize(msg.attachments[0].size) + '</div></div>'
    }
  }
  var regex = new RegExp(/&lt;@!?(\d+)&gt;/ig)
  var ghCodeblock = new RegExp(/```[\s\S]*```/g).exec(msg.content)
  var codeblock = new RegExp(/`[\s\S]*`/g).exec(msg.content)
  var i = 0
  var j = 0
  return msg.content.replace(/#/g, '&#35;').replace(/-/g, '&#45;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/\[/ig, '&#91;').replace(/\(/ig, '&#40;').replace(/\./ig, '&#46;').replace(/\+/ig, '&#43;').replace(regex, function (m, r) {
    m = m.replace(/&gt;/ig, '>').replace(/&lt;/ig, '<')
    if (msg.type !== 6 && msg.mentions[i] === undefined && r !== 0 && m.startsWith('<@')) {
      i++
      if (msg.mentions[i] === undefined) {
        if (bot.users.has(m.substr(2, m.length - 3))) m = m.replace(m, '<span class="mention">@' + bot.users.get(m.substr(2, m.length - 3)).username + '</span>')
        else m = m.replace(m, '<span class="mention">' + m + '</span>')
      }
      if (msg.mentions[i] !== undefined) {
        if (msg.type === 6) m = m.replace(m, msg.mentions[i].username)
        if (msg.type !== 6) m = m.replace(m, '<span class="mention">@' + msg.mentions[i].username + '</span>')
      }
    }
    if (msg.type === 6 && msg.mentions[i] !== undefined) m = m.replace(m, '<span class="username">' + msg.mentions[i].username + '</span>')
    if (msg.type !== 6 && msg.mentions[i] !== undefined) m = m.replace(m, '<span class="mention">@' + msg.mentions[i].username + '</span>')
    return m
  }).replace(/@everyone/ig, '<span class="mention">@everyone</span>').replace(/@here/ig, '<span class="mention">@here</span>').replace(/https?:\/\/[\S]*/ig, function (m, r) {
    return m.replace(m, '<a href="' + m + '">' + m + '</a>')
  }).replace(/&lt;&#35;(\d+)&gt;/g, function (m, r) {
    var channel = '&#35;deleted-channel'
    if (bot.channels.get(r) !== undefined) channel = '<span class="mention">&#35;' + bot.channels.get(r).name + '</span>'
    m = m.replace(m, channel)
    return m
  }).replace(/(?:\\)?(?:&lt;){1,2}:[0-9a-z--_]+:(\d+)&gt;(?:\d+)?(?:&gt;)?/ig, function (m, r) {
    if (m.includes('\\')) return m.replace(m, m.substr(1))
    return m.replace(m, '<img class="emoji" src="https://cdn.discordapp.com/emojis/' + r + '.png"/>')
  }).replace(/[\s\S]+/ig, function (m, r) {
    return twemoji.parse(m, {
      folder: 'svg',
      ext: '.svg'
    })
  }).replace(/`[\s\S]*`/g, codeblock).replace(/```[\s\S]*```/g, function (m) {
    return ghCodeblock[0].replace(/```([\S]+)/g, '```$1\n').replace(/([\s\S]+)```/g, '$1\n```')
  }) + edit + attachEnd
}
function parseCmd (input) {
  if (!input.startsWith('/') && input !== '') return sendMessage(activeChannel, input)
  var command = input.trim().split(' ')[0]
  var suffix = input.trim().substr(command.length + 1)
  if (command === '/ping') {
    var time = Date.now()
    $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(0, 255, 45, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + time + '" class="markup"><p>Ping!</p></span></div></div></div></div>'))
    apiCall('GET', 'https://discordapp.com/api/users/@me', true, {authorization: token}).then(() => {
      $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p>Ping! Time taken ' + Math.floor(Date.now() - time) + 'ms.<span class="edited">(edited)</span></p>'
    })
  }
  if (command === '/eval') {
    var time = Date.now()
    $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(0, 255, 45, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + time + '" class="markup"><p>**Evaluating**</p></span></div></div></div></div>'))
    try {
      var evald = eval(suffix)
      if (typeof evald !== 'object') {
        $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p><strong>Result:</strong>\n' + evald + '<span class="edited">(edited)</span></p>'
      }
    } catch (e) {
      $(document.querySelector('[data-id="' + time + '"]'))[0].innerHTML = '<p><strong>Result:</strong>\n' + e + '<span class="edited">(edited)</span></p>'
    }
  }
  if (command === '/tableflip') {
    sendMessage(activeChannel, suffix + ' (╯°□°）╯︵ ┻━┻')
  }
  if (command === '/unflip') {
    sendMessage(activeChannel, suffix + ' ┬─┬﻿ ノ( ゜-゜ノ)')
  }
  if (command === '/theme') {
    var themes = ['dark', 'light']
    var val = themes.indexOf(localStorage.theme)
    if (themes.indexOf(localStorage.theme) > -1) {
      if (val !== themes.length - 1) localStorage.theme = themes[val + 1]
      else localStorage.theme = themes[0]
      $('body').attr('class', 'theme-' + localStorage.theme)
      $('.messages-container').append($('<div class="msg-group" style="margin:0;background: rgba(0, 255, 45, 0.11)">').append('<div class="message" style="padding-left:20px;"><div class="avatar-large" style="background-image: url(\'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png\');"></div><div class="comment" data-uid="0"><h2><span class="username-wrap"><strong class="username">System</strong></span><span data-timestamp="' + Date.now() + '" class="timestamp">' + moment(Date.now()).calendar() + '</span></h2><div class="message-text"><span data-id="' + time + '" class="markup"><p>Changed theme to <strong>' + localStorage.theme + '</strong></p></span></div></div></div></div>'))
    }
  }
}
