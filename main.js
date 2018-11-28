require('dotenv').config()
var Discord = require('discord.io');
var logger = require('winston');
var Twitter = require('twitter');


/*var client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});*/

var accountList = [{
    channelID: '244864136188526594',
    twitterAccount: 'plynde'
}];

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});

logger.level = 'debug';
// Initialize Discord Bot

var bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
});

bot.on('ready', function(evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

/*client.stream('statuses/filter', { follow: accountList.map(a => a.twitterAccount).join(',') }, function(stream) {
    stream.on('data', function(event) {
        // base on twitter account send it to the right channel
        var result = accountList.filter(obj => obj.twitterAccount === event.username); // to change
        bot.sendMessage({
            to: result.channelID,
            message: event.text
        });
        
        console.log(event && event.text);
    });
  
    stream.on('error', function(error) {
        throw error;
    });
});*/

bot.on('message', function(user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        console.log(user, userID, channelID, message, evt);

        //args = args.splice(1);
        switch (cmd) {
            // !follow
            case 'follow':
                accountList.push({
                    channelID: evt.d.channel_id,
                    twitterAccount: args[1]
                });
                bot.sendMessage({
                    to: channelID,
                    message: `J'ai ajoute ${args[1]} dans la liste des comptes a suivre.`
                });
                break;
            // !list
            case 'list':
                bot.sendMessage({
                    to: channelID,
                    message: `Voici la liste des comptes: ${accountList.map(a => a.twitterAccount).join(', ')}.`
                });
                break;
            // !remove
            case 'remove':
                accountList = accountList.filter(obj => obj.twitterAccount !== args[1]);
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