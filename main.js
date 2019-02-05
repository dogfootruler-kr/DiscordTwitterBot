require('dotenv').config()
var Discord = require('discord.io');
var Twitter = require('twit');
var accountList = require('./accountList.json');
var fs = require('fs');

var client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});

var StreamClient;

var bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
});

bot.on('ready', function(evt) {
    console.log(bot.username + ' - (' + bot.id + ')');
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

                    accountList.accounts.push({
                        channelID: evt.d.channel_id,
                        twitterAccount: userObj[0].name,
                        twitterScreenName: args[1],
                        twitterAccountID: userObj[0].id_str,
                        iconURL: userObj[0].profile_image_url
                    });

                    var json = JSON.stringify(accountList);
                    fs.writeFileSync('./accountList.json', json, 'utf8', () => {
                        console.log(`${userObj[0].name} ajoute a la liste.`);
                    });

                    bot.sendMessage({
                        to: channelID,
                        message: `J'ai ajouté ${userObj[0].name} dans la liste des comptes a suivre.`
                    });

                    StreamClient.stop();
                    startFollowing();
                });

                break;
            // !list
            case 'list':
                bot.sendMessage({
                    to: channelID,
                    message: `Voici la liste des comptes: ${accountList.accounts.filter(a => a.channelID === channelID).map(a => a.twitterAccount + ' (@' + a.twitterScreenName + ')').join(', ')}.`
                });
                break;
            // !remove
            case 'remove':
                accountList.accounts = accountList.accounts.filter(obj => (obj.twitterScreenName.toLowerCase() !== args[1].toLowerCase() || (obj.channelID !== channelID && obj.twitterScreenName.toLowerCase() === args[1].toLowerCase())));
                
                var json = JSON.stringify(accountList);
                fs.writeFileSync('./accountList.json', json, 'utf8', () => {
                    console.log(`${args[1]} enleve a la liste.`);
                });
                
                bot.sendMessage({
                    to: channelID,
                    message: `J'ai enlevé ${args[1]} de la liste des comptes a suivre.`
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

bot.on('disconnect', function(errMsg, code) {
    console.log(`Disconnected from Discord. Error Code ${code}. Message ${errMsg}.`);
    bot.connect();
});

function startFollowing() {
    StreamClient = client.stream('statuses/filter', { follow: accountList.accounts.map(a => a.twitterAccountID).join(',') });
    StreamClient.on('tweet', function(tweet) {
        // base on twitter account send it to the right channel
        let results = accountList.accounts.filter(obj => obj.twitterAccountID === tweet.user.id_str);

        for (let i=0; i<results.length; i++) {
            let result = results[i];
            let text = '';
            let imgURL = '';
            let embedObject = {};
            let fields = [{
                name: 'Envoyé depuis',
                value: tweet.user.location ? tweet.user.location : 'Localisation inconnue',
                inline: true
            }];

            if (tweet.extended_tweet) {
                text = tweet.extended_tweet.full_text;
            } else if (tweet.retweeted_status && tweet.retweeted_status.extended_tweet) {
                text = tweet.retweeted_status.extended_tweet.full_text;
            } else {
                text = tweet.text;
            }

            if (tweet.extended_entities && !!tweet.extended_entities.media.length && tweet.extended_entities.media[0].type === 'photo') {
                imgURL = tweet.extended_entities.media[0].media_url;
                if (tweet.extended_entities.media.length > 1) {
                    for (var j = 1; j < tweet.extended_entities.media.length; j++) {
                        fields.push({
                            name: `Photo numéro ${j + 1}`,
                            value: tweet.extended_entities.media[j].media_url
                        });
                    }
                }
            } else if (tweet.extended_entities && !!tweet.extended_entities.media.length && tweet.extended_entities.media[0].type !== 'photo') {
                if (tweet.extended_entities.media[0].video_info.variants.length > 0) {
                    fields.push({
                        name: `Vidéo/gif`,
                        value: (tweet.extended_entities.media[0].video_info.variants.filter(a => a.bitrate >= 832000)[0] || {}).url
                    });
                }
            }

            embedObject = {
                color: 3447003,
                author: {
                    name: `${result.twitterAccount} (@${result.twitterScreenName})`,
                    icon_url: result.iconURL,
                    url: `https://twitter.com/${result.twitterScreenName}`
                },
                url: `https://twitter.com/${result.twitterScreenName}/status/${tweet.id_str}`,
                title: 'Lien vers le tweet',
                description: text,
                image: {
                    url: imgURL
                },
                fields: fields,
                timestamp: new Date().toISOString()
            };

            bot.sendMessage({
                to: result.channelID,
                embed: embedObject
            });
        }
    });

    StreamClient.on('error', function(error) {
        console.error(error);
        StreamClient.stop();
        startFollowing();
    });
}
