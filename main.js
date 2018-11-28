var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: auth.consumer_key,
    consumer_secret: auth.consumer_secret,
    access_token_key: auth.access_token_key,
    access_token_secret: auth.access_token_secret
});

var accountList = ['plynde'];

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot

var bot = new Discord.Client({
    token: auth.token,
    autorun: true
});

bot.on('ready', function(evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

client.stream('statuses/filter', { follow: accountList.join(',') }, function(stream) {
    stream.on('data', function(event) {
        bot.sendMessage({
            to: channelID,
            message: event.text
        });
        
        console.log(event && event.text);
    });
  
    stream.on('error', function(error) {
      throw error;
    });
});

bot.on('message', function(user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        //args = args.splice(1);
        switch (cmd) {
            // !follow
            case 'follow':
                accountList.push(args[1]);
                bot.sendMessage({
                    to: channelID,
                    message: `J'ai ajoute ${args[1]} dans la liste des comptes a suivre.`
                });
                break;
            // !list
            case 'list':
                bot.sendMessage({
                    to: channelID,
                    message: `Voici la liste des comptes: ${accountList.join(', ')}.`
                });
                break;
            // !remove
            case 'remove':
                var index = accountList.indexOf(args[1]);
                if (index !== -1) accountList.splice(index, 1);
                bot.sendMessage({
                    to: channelID,
                    message: `J'ai enleve ${args[1]} de la liste des comptes a suivre.`
                });
                break;
            default:
                bot.sendMessage({
                    to: channelID,
                    message: `Je ne connais pas cette commande, essaye !follow, !list ou !remove.`
                });
                break;
        }
    }
});