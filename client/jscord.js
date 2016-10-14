/*
* JSCord v0.0.1
* The first (most) browser compatible lib!
* Report bugs to Team Cernodile server!
*
* Happy testing,
* Cernodile
*/
var Socket = new WebSocket('wss://gateway.discord.gg/?encoding=json&v=6')
var bot = {}
var botFunction = {}
bot.guilds = new Map()
bot.channels = new Map()
bot.privateChannels = new Map()
bot.users = new Map()
var hBeatInterval = 1000
var token = ''
var botEvent = document.body
var debug = true
var data = {
  "token": '',
  "properties": {
    "$os": "windows",
    "$browser": "JSCord",
    "$device": "JSCord",
  },
  "compress": false,
  "large_threshold": 250
}
var readyHandler = function () {if (debug) console.warn('%c[JSCord] %cMissing ready event handling.', 'color:purple; font-weight: bold;', 'color:#000;')}
var guildHandler = function () {}
var msgHandler = function () {}
var msgEditHandler = function () {}
var msgDelHandler = function () {}
var msgDelBulkHandler = function () {}
var presenceHandler = function () {}
botEvent.addEventListener('close', closeHandle, false)
botEvent.addEventListener('ready', readyHandle, false)
botEvent.addEventListener('guild_create', guildHandle, false)
botEvent.addEventListener('message_create', msgHandle, false)
botEvent.addEventListener('message_update', msgEditHandle, false)
botEvent.addEventListener('message_delete', msgDelHandle, false)
botEvent.addEventListener('message_delete_bulk', msgDelBulkHandle, false)
botEvent.addEventListener('presence_update', presenceHandle, false)
function closeHandle (payload) {
  if (debug) console.warn('%c[Gateway] %cDropped connection ecode ' + payload.detail.status, 'color:purple; font-weight: bold;', 'color:#000;')
  // user can add new "closeHandler" function in their main file, this is the "default"
}
function readyHandle (p) {readyHandler(p)}
function guildHandle (p) {guildHandler(p)}
function msgHandle (p) {msgHandler(p)}
function msgEditHandle (p) {msgEditHandler(p)}
function msgDelHandle (p) {msgDelHandler(p)}
function msgDelBulkHandle (p) {msgDelBulkHandler(p)}
function presenceHandle (p) {presenceHandler(p)}
/*
* All of the perm constants and functions taken from abalabahaha/eris
* Slightly modified to fit Botcord
*/
function getPerm(perm) {
    var result = []
    this.perm = perm
    for(var d of Object.keys(perms)) {
      if (!d.startsWith('all')) {
        if (this.perm & perms[d]) {
          result.push({name: d, value: true})
        }
      }
    }
    return result
}
var perms = {
  createInstantInvite: 1,
  kickMembers:         1 << 1,
  banMembers:          1 << 2,
  administrator:       1 << 3,
  manageChannels:      1 << 4,
  manageGuild:         1 << 5,
  readMessages:        1 << 10,
  sendMessages:        1 << 11,
  sendTTSMessages:     1 << 12,
  manageMessages:      1 << 13,
  embedLinks:          1 << 14,
  attachFiles:         1 << 15,
  readMessageHistory:  1 << 16,
  mentionEveryone:     1 << 17,
  externalEmojis:      1 << 18,
  voiceConnect:        1 << 20,
  voiceSpeak:          1 << 21,
  voiceMuteMembers:    1 << 22,
  voiceDeafenMembers:  1 << 23,
  voiceMoveMembers:    1 << 24,
  voiceUseVAD:         1 << 25,
  changeNickname:      1 << 26,
  manageNicknames:     1 << 27,
  manageRoles:         1 << 28,
  manageEmojis:        1 << 30,
  all:      0b1111111111101111111110000111111,
  allGuild: 0b1111100000000000000000000111111,
  allText:  0b0010000000001111111110000010001,
  allVoice: 0b0010011111100000000000000010001
}
function login (info) {
  var Socket = new WebSocket('wss://gateway.discord.gg/?encoding=json&v=6')
  token = info
  data.token = token
}
Socket.onopen = function () {
  console.log('%c[Gateway] %cConnection established', 'color:purple; font-weight: bold;', 'color:#000;')
}
if (!localStorage.status) localStorage.status = 'online' // Reserved for a feature, k.
Socket.onmessage = function (evt) {
  var event = JSON.parse(evt.data).t
  if (event === 'READY') {
    for (var i in JSON.parse(evt.data).d.private_channels) {
      if (JSON.parse(evt.data).d.private_channels[i].recipients[0]) {
        bot.privateChannels.set(JSON.parse(evt.data).d.private_channels[i].id, JSON.parse(evt.data).d.private_channels[i])
      }
    }
    bot.user = JSON.parse(evt.data).d.user
    if (!bot.user.bot) {
      var guild = JSON.parse(evt.data).d.guilds
      for (var d in guild) {
        guildCreateMap(guild[d])
      }
    }
    botEvent.dispatchEvent(new CustomEvent('ready', {detail: {ready: Date.now()}}))
  }
  if (event === 'PRESENCE_UPDATE') botEvent.dispatchEvent(new CustomEvent('presence_update', {detail: JSON.parse(evt.data).d}))
  if (event === 'GUILD_CREATE') {
    var guild = JSON.parse(evt.data).d
    guildCreateMap(guild)
    botEvent.dispatchEvent(new CustomEvent('guild_create', {detail: guild}))
  }
  if (event === 'MESSAGE_CREATE') {
    if (JSON.parse(evt.data).d.channel_id === activeChannel) {
      var msgObj = {}
      msgObj.content = JSON.parse(evt.data).d.content
      msgObj.author = JSON.parse(evt.data).d.author
      msgObj.id = JSON.parse(evt.data).d.id
      msgObj.edited = null
      msgObj.embeds = JSON.parse(evt.data).d.embeds
      msgObj.attachments = JSON.parse(evt.data).d.attachments
      msgObj.mentions = JSON.parse(evt.data).d.mentions
      msgObj.timestamp = JSON.parse(evt.data).d.timestamp
      msgObj.webhook = JSON.parse(evt.data).d.webhook_id || 0
      if (bot.channels.has(JSON.parse(evt.data).d.channel_id)) {
        msgObj.channel = bot.channels.get(JSON.parse(evt.data).d.channel_id)
        msgObj.member = bot.channels.get(JSON.parse(evt.data).d.channel_id).guild.members.get(msgObj.author.id)
      }
      botEvent.dispatchEvent(new CustomEvent('message_create', {detail: msgObj}))
    }
  }
  if (event === 'MESSAGE_UPDATE') {
    if (JSON.parse(evt.data).d.content) {
      var msg = JSON.parse(evt.data).d
      var msgObj = {}
      msgObj.content = JSON.parse(evt.data).d.content
      msgObj.author = JSON.parse(evt.data).d.author
      msgObj.id = JSON.parse(evt.data).d.id
      msgObj.embeds = JSON.parse(evt.data).d.embeds
      msgObj.edited = JSON.parse(evt.data).d.edited_timestamp
      msgObj.attachments = JSON.parse(evt.data).d.attachments
      msgObj.mentions = JSON.parse(evt.data).d.mentions
      msgObj.timestamp = JSON.parse(evt.data).d.timestamp
      msgObj.webhook = JSON.parse(evt.data).d.webhook_id || 0
      if (bot.channels.has(JSON.parse(evt.data).d.channel_id)) {
        msgObj.channel = bot.channels.get(JSON.parse(evt.data).d.channel_id)
        msgObj.member = bot.channels.get(JSON.parse(evt.data).d.channel_id).guild.members.get(msgObj.author.id)
      }
      botEvent.dispatchEvent(new CustomEvent('message_update', {detail: msgObj}))
    }
  }
  if (event === 'MESSAGE_DELETE') botEvent.dispatchEvent(new CustomEvent('message_delete', {detail: JSON.parse(evt.data).d}))
  if (event === 'MESSAGE_DELETE_BULK') botEvent.dispatchEvent(new CustomEvent('message_delete_bulk', {detail: {ids: JSON.parse(evt.data).d.ids}}))
  if (event === 'GUILD_UPDATE') {
    var dat = JSON.parse(evt.data).d
    guildCreateMap(dat)
    botEvent.dispatchEvent(new CustomEvent('guild_update', {detail: dat}))
  }
  if (event === 'GUILD_DELETE') botEvent.dispatchEvent(new CustomEvent('guild_delete', {detail: JSON.parse(evt.data).d}))
  if (event === 'GUILD_MEMBER_ADD') {
    var dat = JSON.parse(evt.data).d
    var memberData = {}
    var guildObj = bot.guilds.get(dat.guild_id)
    memberData.user = dat.user
    memberData.nick = null || dat.nick
    memberData.joinedAt = dat.joined_at
    memberData.deaf = dat.deaf
    memberData.mute = dat.mute
    memberData.roles = dat.roles
    var permm = {}
    memberData.permissions = {}
    for (var c in dat.roles) {
      var temp = []
      guildObj.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var d in temp) {
        if (memberData.roles.indexOf(temp[d].id) > -1) {
          var fetchPerm = getPerm(guildObj.roles.get(temp[d].id).permissions)
            for (var e in fetchPerm) {
              if (fetchPerm[e]) permm[fetchPerm[e].name] = fetchPerm[e].value
            }
            memberData.permissions = permm
            if (Object.keys(permm).length === 0) memberData.permissions = 0
        }
      }
    }
    memberData.status = 'offline'
    memberData.game = null
    guildObj.members.set(dat.user.id, memberData)
    if (!bot.users.has(memberData.user.id)) {
      var userData = memberData.user
      userData.status = memberData.status
      userData.game = memberData.game
      bot.users.set(memberData.user.id, userData)
    }
    botEvent.dispatchEvent(new CustomEvent('guild_member_add', {detail: memberData}))
  }
  if (event === 'GUILD_MEMBER_REMOVE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    guild.members.delete(dat.user.id)
    botEvent.dispatchEvent(new CustomEvent('guild_member_remove', {detail: dat.user}))
  }
  if (event === 'GUILD_MEMBER_UPDATE') {
    var member = bot.guilds.get(JSON.parse(evt.data).d.guild_id).members.get(JSON.parse(evt.data).d.user.id)
    if (member.roles.length !== JSON.parse(evt.data).d.roles) member.roles = JSON.parse(evt.data).d.roles
    if (member.nick !== JSON.parse(evt.data).d.nick) member.nick = JSON.parse(evt.data).d.nick
    bot.guilds.get(JSON.parse(evt.data).d.guild_id).members.set(member.user.id, member)
  }
  if (event === 'GUILD_ROLE_CREATE' || event === 'GUILD_ROLE_UPDATE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    var roleData = {}
    roleData.name = dat.role.name
    roleData.hoist = dat.role.hoist
    roleData.color = dat.role.color.toString(16)
    roleData.id = dat.role.id
    roleData.managed = dat.role.managed
    roleData.mentionable = dat.role.mentionable
    roleData.permissions = dat.role.permissions
    roleData.position = dat.role.position
    guild.roles.set(roleData.id, roleData)
    if (event === 'GUILD_ROLE_CREATE') botEvent.dispatchEvent(new CustomEvent('guild_role_create', {detail: roleData}))
    if (event === 'GUILD_ROLE_UPDATE') botEvent.dispatchEvent(new CustomEvent('guild_role_update', {detail: roleData}))
  }
  if (event === 'GUILD_ROLE_DELETE') {
    var dat = JSON.parse(evt.data).d
    var guild = bot.guilds.get(dat.guild_id)
    guild.roles.delete(dat.role.id)
    botEvent.dispatchEvent(new CustomEvent('guild_role_delete', {detail: dat.role}))
  }
  if (JSON.parse(evt.data).op === 10) {
    if (debug) console.log('%c[Gateway] %c[Hello] via ' + JSON.parse(evt.data).d._trace + ', heartbeat interval: ' + JSON.parse(evt.data).d['heartbeat_interval'], 'color:purple; font-weight: bold;', 'color:#000;')
    Socket.send(JSON.stringify({"op": 1, "d": 0}))
    if (debug) console.log('%c[Gateway] %cHeartbeat', 'color:purple; font-weight: bold;', 'color:#000;')
    Socket.send(JSON.stringify({"op": 2, "d": data}))
    if (debug) console.log('%c[Gateway] %cIndentify', 'color:purple; font-weight: bold;', 'color:#000;')
    hBeatInterval = JSON.parse(evt.data).d['heartbeat_interval']
  }
  if (JSON.parse(evt.data).op === 11) {
    setTimeout(() => {
      Socket.send(JSON.stringify({"op": 1, "d": 0}))
      if (debug) console.log('%c[Gateway] %cHeartbeat', 'color:purple; font-weight: bold;', 'color:#000;')
    }, hBeatInterval)
  }
}
Socket.onclose = function (evt) {
  botEvent.dispatchEvent(new CustomEvent('close', {detail: {status: evt.code}}))
}
Socket.onerror = function (e) {
  botEvent.dispatchEvent(new CustomEvent('error', {detail: e}))
}
function apiCall(method, url, sync, headers) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest()
    var data = {}
    xhr.addEventListener('readystatechange', function () {
      if (xhr.readyState == 4) return resolve(JSON.parse(this.responseText))
    })
    xhr.onerror = function (e) {
      return reject(e)
    }
    xhr.open(method, url, sync)
    var botheader = ''
    if (bot.user.email === null) botheader = 'Bot '
    if (headers.authorization) xhr.setRequestHeader('Authorization', botheader + headers.authorization)
    if (headers.body) data = JSON.stringify(headers.body)
    if (!headers.contentType) xhr.setRequestHeader("Content-Type", "application/json")
    if (headers.contentType === 'multipart/form-data') xhr.send(headers.formdata)
    else xhr.send(data)
  })
}
function guildCreateMap (guild) {
  var guildObj = {}
  guildObj.members = new Map()
  guildObj.channels = new Map()
  guildObj.roles = new Map()
  guildObj.mfa = guild.mfa_level
  guildObj.emojis = guild.emojis
  guildObj.region = guild.region
  guildObj.owner = guild.owner_id
  guildObj.large = guild.large
  guildObj.id = guild.id
  guildObj.name = guild.name
  guildObj.icon = guild.icon
  guildObj.memberCount = guild.member_count
  for (var i in guild.roles) {
    var roleData = {}
    roleData.name = guild.roles[i].name
    roleData.hoist = guild.roles[i].hoist
    roleData.color = guild.roles[i].color.toString(16)
    roleData.id = guild.roles[i].id
    roleData.managed = guild.roles[i].managed
    roleData.mentionable = guild.roles[i].mentionable
    roleData.permissions = guild.roles[i].permissions
    roleData.position = guild.roles[i].position
    guildObj.roles.set(roleData.id, roleData)
  }
  for (var i in guild.members) {
    var memberData = {}
    memberData.user = guild.members[i].user
    memberData.nick = null || guild.members[i].nick
    memberData.joinedAt = guild.members[i].joined_at
    memberData.deaf = guild.members[i].deaf
    memberData.mute = guild.members[i].mute
    memberData.roles = guild.members[i].roles
    var permm = {}
    memberData.permissions = {}
    for (var c in guild.members[i].roles) {
      var temp = []
      guildObj.roles.forEach((role) => {
        temp.push({position: role.position, color: role.color, id: role.id})
      })
      temp = temp.sort(function(a,b){return a.position - b.position})
      for (var d in temp) {
        if (memberData.roles.indexOf(temp[d].id) > -1) {
          var fetchPerm = getPerm(guildObj.roles.get(temp[d].id).permissions)
            for (var e in fetchPerm) {
              permm[fetchPerm[e].name] = fetchPerm[e].value
            }
            memberData.permissions = permm
            if (Object.keys(permm).length === 0) memberData.permissions = 0
        }
      }
    }
    memberData.status = 'offline'
    memberData.game = null
    for (var d in guild.presences) {
      if (guild.presences[d].user.id === memberData.user.id) {
        memberData.status = guild.presences[d].status
        memberData.game = guild.presences[d].game
      }
    }
    guildObj.members.set(guild.members[i].user.id, memberData)
    if (!bot.users.has(memberData.user.id)) {
      var userData = memberData.user
      userData.status = memberData.status
      userData.game = memberData.game
      bot.users.set(memberData.user.id, userData)
      botEvent.dispatchEvent(new CustomEvent('presence_update', {detail: memberData}))
    } else {
      if (bot.users.get(memberData.user.id).game === null) {
        var userData = memberData.user
        userData.status = memberData.status
        userData.game = memberData.game
        bot.users.set(memberData.user.id, userData)
        botEvent.dispatchEvent(new CustomEvent('presence_update', {detail: memberData}))
      }
    }
  }
  for (var i in guild.channels) {
    var channelData = {}
    if (guild.channels[i].type === 0) {
      channelData.name = guild.channels[i].name
      channelData.id = guild.channels[i].id
      channelData.position = guild.channels[i].position
      channelData.lastMessageID = guild.channels[i].last_message_id
      channelData.lastPinDate = guild.channels[i].last_pin_timestamp
      channelData.topic = guild.channels[i].topic
      channelData.type = guild.channels[i].type
      channelData.permissions = guild.channels[i].permission_overwrites
      guildObj.channels.set(guild.channels[i].id, channelData)
    }
  }
  guildObj.channels.forEach((channel) => {
    channel.guild = guildObj
    bot.channels.set(channel.id, channel)
  })
  bot.guilds.set(guild.id, guildObj)
}
function sendMessage (channel, content) {
  return apiCall('POST', 'https://discordapp.com/api/channels/' + channel + '/messages', true, {authorization: token, body: {content: content}})
}
function editMessage (channel, id, content) {
  return apiCall('PATCH', 'https://discordapp.com/api/channels/' + channel + '/messages/' + id, true, {authorization: token, body: {content: content}})
}
function deleteMessage (channel, id) {
  return apiCall('DELETE', 'https://discordapp.com/api/channels/' + channel + '/messages/' + id, true, {authorization: token})
}
function editGame (status, game) {
  if (!game) game = {"name": null}
  return Socket.send(JSON.stringify({"op": 3, "d": {"game": game, "afk": "", "since": Date.now(), "status": status}}))
}
function editSelf (options) {
  return apiCall('POST', 'https://discordapp.com/api/users/@me', true, {authorization: token, body: options})
}
function createDMchannel (id) {
  return apiCall('POST', 'https://discordapp.com/api/users/@me/channels', true, {authorization: token, body: {"recipient_id": id}})
}
function deleteChannel (id) {
  return apiCall('DELETE', 'https://discordapp.com/api/channels/' + id, true, {authorization: token})
}
function closeChannel (id) {
  return apiCall('DELETE', 'https://discordapp.com/api/channels/' + id, true, {authorization: token})
}
function leaveGuild (id) {
  return apiCall('DELETE', 'https://discordapp.com/api/users/@me/guilds/' + id, true, {authorization: token})
}
function uploadFile (channel, file) {
  return apiCall('POST', 'https://discordapp.com/api/channels/' + channel + '/messages', true, {authorization: token, contentType: 'multipart/form-data', formdata: file})
}
function joinServer (code) {
  if (!bot.user.bot) return apiCall('POST', 'https://discordapp.com/api/invites/' + code, true, {authorization: token})
  return console.error('This endpoint is only for user accounts!')
}
function disconnect () {return Socket.close()}
