"use strict"
const Eris = require('eris')
const config = require('./config.json')
var token = config.settings.token
var port = config.settings.port
var bot = new Eris(token)
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var activeChannel = ''
var dm = false
var dms = {}
/*
* Style
*/
var span1 = '<span style="position: initial; display: inline-block; padding-top: 5px; padding-left: 5px;">'
var spanbot = '<span style="background: rgba(89, 182, 251, 0.78); font-size: 12px; color: #000; border-radius: 5px; padding: 1px 2px 1px 2px;">'
var date = '<span style="font-size: 10px; color: #ccc">'

http.listen(port, function() {
  console.log('Webserver listening on port ' + port);
})
app.get('/', function(req, res){
  res.sendFile(__dirname + '/chat.html');
})
bot.on('ready', () => {
  console.log('Eris loaded!')
})
function clydeMsg (msg) {
    return io.emit('chat message', msg, 'https://discordapp.com/assets/f78426a064bc9dd24847519259bc42af.png', span1 + 'Clyde<span style="font-size: 11px; color:#ddd;">#0000</span> ' + spanbot + 'BOT</span> at ' + date + new Date(Date.now()).toLocaleString() + '</span></span>')
  }
function listMembers (id) {
  return io.emit('memberr', id)
}
io.on('connection', function (socket) {
  socket.on('chat message', function (msg, auth) {
  if (auth === config.auth.masterpass) {
    var guild = undefined;
    var getChannel = bot.getChannel(activeChannel)
    if (getChannel !== undefined) guild = getChannel.guild
	if (guild === undefined && !dm) return clydeMsg("Your message could not be delivered because you don't share a server with the recipient or you disabled direct messages on your shared server, recipient is only accepting direct messages from friends, or you were blocked by the recipient.")
	if (msg.startsWith('/comment')) {
	  if (msg.substr('./comment'.length).length >= 0) return clydeMsg('Comment: ' + msg.substr('./comment'.length))
	}
    if (msg.startsWith('/shrug')) return bot.createMessage(activeChannel, msg.substr('/shrug '.length) + ' ¯\\_(ツ)\_/¯')
    if (msg.startsWith('/tableflip')) return bot.createMessage(activeChannel, msg.substr('/tableflip '.length) + ' (╯°□°）╯︵ ┻━┻')
    if (msg.startsWith('/unflip')) return bot.createMessage(activeChannel, msg.substr('/unflip '.length) + ' ┬─┬ ノ( ゜-゜ノ)')
    if (msg.startsWith('/me')) return bot.createMessage(activeChannel, '_' + msg.substr('/me '.length) + '_')
	if (!dm) {
      if (msg.startsWith('/nick')) {
        if (msg.substr('/nick'.length).length <= 6) {
          if (guild !== undefined) bot.editNickname(guild.id, '')
          return clydeMsg('Your nickname on this server has been reset.')
        }
        if (guild !== undefined) bot.editNickname(guild.id, msg.substr('/nick '.length))
        return clydeMsg('Your nickname on this server has been changed to <strong>' + msg.substr('/nick '.length) + '</strong>.')
      }
	}
    return bot.createMessage(activeChannel, msg)
  }
    return io.emit('chat message', '> Someone tried to send chat message without authentication!')
  })
  socket.on('auth', function (msg) {
    if (msg === config.auth.masterpass) {
      return io.emit('auth', '200', msg)
    }
  })
  socket.on('getChannel', function() {
    if (activeChannel !== '') {
      var d = {}
      if (!dm) d = bot.getChannel(activeChannel)
      if (dm) {
        d.name = bot.getChannel(activeChannel).recipient.username + '<span style="font-size: 14px; color: #ccc;">#' + bot.getChannel(activeChannel).recipient.discriminator + '</span>'
        d.topic = ''
      }
        if (d !== null) {
          io.emit('getChannel', d.name, '', dm)
        }
      if (d.topic === null) d.topic = ''
      if (d !== undefined) return io.emit('getChannel', d.name, '<span style="font-size: 12px; color: #ccc;">' + d.topic + '</span>', dm)
    }
    return io.emit('getChannel', 'not-in-a-channel', '<span style="font-size: 14px; color: #ccc;">right now.</span>')
  })
  socket.on('eval', function(code, auth) {
    if (auth === config.auth.masterpass) {
      try {
        var result = eval(code) // eslint-disable-line
        if (typeof result !== 'object') {
          clydeMsg('<strong>Result</strong><br/> ' + result)
        }
      } catch (e) {
        clydeMsg('<strong>Result</strong><br/> ' + e)
      }
    }
  })
  socket.on('channelChange', function (id, auth, type) {
    if (auth === config.auth.masterpass) {
	  if (type === '0') {
        var getChannel = bot.getChannel(id)
        if (getChannel !== undefined) {
		    dm = false
          activeChannel = id
          io.emit('channelChange', dm)
          return clydeMsg('The channel has been successfuly changed.')
        }
		return clydeMsg('The channel ID specified is either unavailable or invalid.')
      } if (type === '1') {
		bot.getDMChannel(id).then((dmc) => {
		  if (dmc !== undefined) {
			  dm = true
			  activeChannel = dmc.id
			  io.emit('channelChange', dm)
			  return clydeMsg('The channel has been successfuly changed.')
		  }
		  return clydeMsg('The channel ID specified is either unavailable or invalid.')
		})
	  }
	}
  })
  socket.on('memberr', function (id) {
    var getChannel = bot.getChannel(activeChannel);
    var users = []
    if (!getChannel) return clydeMsg('Something went wrong! Try again later!')
    getChannel.guild.members.forEach((user) => {
      if (!user) return clydeMsg('Something went wrong! Try again later!')
      if (user.user.avatar !== null) users.push('<img src=https://cdn.discordapp.com/avatars/"' + user.id + '/' + user.user.avatar + '.jpg" class="profile"/>' + user.user.username)
      if (user.user.avatar === null) users.push('<img src="https://discordapp.com/assets/' + user.user.defaultAvatar + '.png" class="profile"/>' + user.user.username)
    })
      return users
  })
})

bot.on('messageCreate', (msg) => {
  if (msg.channel.id === activeChannel) {
    var avatar;
    var user = msg.author.username + '<span style="font-size: 11px; color:#ddd;">#' + msg.author.discriminator + '</span> '
    if (msg.author.avatar !== null) avatar = `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.jpg`
    if (msg.author.avatar === null) avatar = `https://discordapp.com/assets/${msg.author.defaultAvatar}.png`
    if (msg.author.id === bot.user.id) return io.emit('chat message', msg.cleanContent, avatar, span1 + user + spanbot + 'BOT</span> at ' + date + new Date(Date.now()).toLocaleString() + '</span></span>')
    if (msg.author.bot) return io.emit('chat message', msg.cleanContent, avatar, span1 + user + spanbot + 'BOT</span> at ' + date + new Date(Date.now()).toLocaleString())
    io.emit('chat message', msg.cleanContent, avatar, span1 + user + 'at ' + date + new Date(Date.now()).toLocaleString())
  }
})
bot.connect()
//'206439201732820992'
