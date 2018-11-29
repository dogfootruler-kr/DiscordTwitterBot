require('dotenv').config()
var Discord = require('discord.io');
var logger = require('winston');
var Twitter = require('twit');

const express = require('express');
const app = express();
app.listen(process.env.PORT || 3000);

var client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

var StreamClient;

var accountList = [{
    channelID: '517367785899425815',
    twitterAccount: 'Patou',
    twitterScreenName: 'plynde',
    twitterAccountID: '146978473',
    iconURL: 'https://pbs.twimg.com/profile_images/1258432399/wallpaper-549640_normal.jpg'
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
    startFollowing();
});

bot.on('message', function(user, userID, channelID, message, evt) {
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        switch (cmd) {
            // !follow
            case 'follow':
                client.get('users/lookup', { screen_name: args[1] }, function(error, userObj) {
                    if (error) {
                        bot.sendMessage({
                            to: channelID,
                            message: `Impossible de trouver le compte ${args[1]}.`
                        });
                        return;
                    }

                    accountList.push({
                        channelID: evt.d.channel_id,
                        twitterAccount: userObj[0].name,
                        twitterScreenName: args[1],
                        twitterAccountID: userObj[0].id_str,
                        iconURL: userObj[0].profile_image_url
                    });
                    bot.sendMessage({
                        to: channelID,
                        message: `J'ai ajoute ${userObj[0].name} dans la liste des comptes a suivre.`
                    });

                    StreamClient.stop();
                    startFollowing();
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
                accountList = accountList.filter(obj => obj.twitterScreenName.toLowerCase() !== args[1].toLowerCase());
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

function startFollowing() {
    StreamClient = client.stream('statuses/filter', { follow: accountList.map(a => a.twitterAccountID).join(',') });
    StreamClient.on('tweet', function(tweet) {
        // base on twitter account send it to the right channel
        var result = accountList.filter(obj => obj.twitterAccountID === tweet.user.id_str)[0];

        if (result) {
            bot.sendMessage({
                to: result.channelID,
                embed: {
                    color: 3447003,
                    author: {
                        name: result.twitterAccount,
                        icon_url: result.iconURL,
                        url: `https://twitter.com/${result.twitterAccount}`
                    },
                    url: `https://twitter.com/${result.twitterScreenName}/status/${tweet.id_str}`,
                    title: result.twitterAccount,
                    description: tweet.text,
                    footer: {
                        text: `Tweet created on ${new Date()}`,
                        icon_url: 'https://cdn1.iconfinder.com/data/icons/iconza-circle-social/64/697029-twitter-512.png'
                    }
                }
            });
        }
    });

    StreamClient.on('error', function(error) {
        console.error(error);
    });
}