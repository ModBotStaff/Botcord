const Eris = require('eris')
const config = require('./config.json')
var token = config.settings.token
var port = config.settings.port
var bot = new Eris(token)
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var activeChannel = 'your channel id where you want to test'

http.listen(port, function(){
  console.log('listening on *:' + port);
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/chat.html');
})
bot.on('ready', () => {
  console.log('Ready!')
})

io.on('connection', function (socket) {
  socket.on('chat message', function (msg, auth) {
  if (auth === config.auth.masterpass) return bot.createMessage(activeChannel, msg)
    return io.emit('chat message', '> Someone tried to send chat message without authentication!')
  })
  socket.on('auth', function (msg) {
    if (msg === config.auth.masterpass) {
      return io.emit('auth', '200', msg)
    }
  })
})

bot.on('messageCreate', (msg) => {
  if (msg.channel.id === activeChannel) {
    if (msg.author.id === bot.user.id) return io.emit('chat message', '> You: ' + msg.cleanContent)
    if (msg.author.bot) return io.emit('chat message', msg.author.username + ' [BOT]: ' + msg.cleanContent)
    io.emit('chat message', msg.author.username + ': ' + msg.cleanContent)
  }
})
bot.connect()
//'206439201732820992'
