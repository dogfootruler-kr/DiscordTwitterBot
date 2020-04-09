'use strict';

require('dotenv').config();
const Discord = require('discord.io');
const Twitter = require('twit');
const DB = require('./db');
const db = new DB();

/* eslint-disable camelcase */
const client = new Twitter({
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
});
/* eslint-enable camelcase */

const bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
});


var StreamClient;
var accountList;
var queue = [];

db.selectAllUsers().then((res) => {
    accountList = res;
});

setInterval(() => {
    if (queue.length === 0) { return; }

    let messageToSend = queue.shift();
    let roughByteSize = JSON.stringify(messageToSend).length;
    console.log(`Sending message queue. Queue length: ${queue.length}, Message length: ${roughByteSize}`);

    if (roughByteSize >= 4096) { return; }

    bot.sendMessage(messageToSend);
}, 1500);

bot.on('ready', function () {
    console.log(bot.username + ' - (' + bot.id + ')');
    setTimeout(startFollowing, 5000);
});

bot.on('message', function (user, userID, channelid, message, evt) {
    if (message.substring(0, 1) === '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];

        switch (cmd) {
            // !follow
            case 'follow':
                client.get('users/lookup', {
                    screen_name: args[1] // eslint-disable-line camelcase
                }, function (error, userObj) {
                    if (error) {
                        queue.push({
                            to: channelid,
                            message: `Impossible de trouver le compte ${args[1]}.`
                        });
                        return;
                    }

                    db.selectUserByScreenNameAndChannelId(args[1], evt.d.channel_id).then((result) => {
                        if (result) {
                            queue.push({
                                to: channelid,
                                message: `${userObj[0].name} est déja dans la liste des comptes a suivre.`
                            });
                            return;
                        }

                        db.insert({
                            channelid: evt.d.channel_id,
                            twitteraccount: userObj[0].name,
                            twitterscreenname: args[1],
                            twitteraccountid: userObj[0].id_str,
                            iconurl: userObj[0].profile_image_url
                        }).then(() => {
                            db.selectAllUsers().then((res) => {
                                accountList = res;

                                queue.push({
                                    to: channelid,
                                    message: `J'ai ajouté ${userObj[0].name} dans la liste des comptes a suivre.`
                                });

                                StreamClient.stop();
                                startFollowing();
                            });
                        });
                    });
                });

                break;
            // !list
            case 'list':
                queue.push({
                    to: channelid,
                    message: `Voici la liste des comptes: ${accountList.filter(a => a.channelid === channelid)
                        .map(a => a.twitteraccount + ' (@' + a.twitterscreenname + ')').join(', ')}.`
                });
                break;
            // !remove
            case 'remove':
                db.selectUserByScreenNameAndChannelId(args[1], channelid).then((result) => {
                    if (!result) {
                        queue.push({
                            to: channelid,
                            message: `${args[1]} n'est pas dans la liste des comptes a suivre.`
                        });
                        return;
                    }

                    db.deleteByScreenName(args[1].toLowerCase()).then(() => {
                        db.selectAllUsers().then((res) => {
                            accountList = res;
                            console.log(`${args[1]} enleve a la liste.`);
                            queue.push({
                                to: channelid,
                                message: `J'ai enlevé ${args[1]} de la liste des comptes a suivre.`
                            });
                            StreamClient.stop();
                            startFollowing();
                        });
                    });
                });
                break;
            default:
                break;
        }
    }
});

bot.on('disconnect', function (errMsg, code) {
    if (code === 1000) {
        console.error('Reconnecting now...');
        bot.connect();
    }
});

function startFollowing() {
    StreamClient = client.stream('statuses/filter', {
        follow: accountList.map(a => a.twitteraccountid).join(',')
    });
    StreamClient.on('tweet', function (tweet) {
        // base on twitter account send it to the right channel
        let results = accountList.filter(obj => obj.twitteraccountid === tweet.user.id_str);

        for (let i = 0; i < results.length; i++) {
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
            } else if (tweet.retweeted_status) {
                break;
            } else {
                text = tweet.text;
            }

            if (tweet.extended_entities && !!tweet.extended_entities.media.length
                && tweet.extended_entities.media[0].type === 'photo') {
                imgURL = tweet.extended_entities.media[0].media_url;
                if (tweet.extended_entities.media.length > 1) {
                    for (var j = 1; j < tweet.extended_entities.media.length; j++) {
                        fields.push({
                            name: `Photo numéro ${j + 1}`,
                            value: tweet.extended_entities.media[j].media_url
                        });
                    }
                }
            } else if (tweet.extended_entities && !!tweet.extended_entities.media.length
                && tweet.extended_entities.media[0].type !== 'photo') {
                if (tweet.extended_entities.media[0].video_info.variants.length > 0) {
                    fields.push({
                        name: 'Vidéo/gif',
                        value: (tweet.extended_entities.media[0]
                            .video_info.variants.filter(a => a.bitrate >= 832000)[0] || {}).url
                    });
                }
            }

            embedObject = {
                color: 3447003,
                author: {
                    name: `${result.twitteraccount} (@${result.twitterscreenname})`,
                    icon_url: result.iconurl, // eslint-disable-line camelcase
                    url: `https://twitter.com/${result.twitterscreenname}`
                },
                url: `https://twitter.com/${result.twitterscreenname}/status/${tweet.id_str}`,
                title: 'Lien vers le tweet',
                description: text,
                image: {
                    url: imgURL
                },
                fields: fields,
                timestamp: new Date().toISOString()
            };

            queue.push({
                to: result.channelid,
                embed: embedObject
            });
        }
    });

    StreamClient.on('error', function (error) {
        console.error(error);
        StreamClient.stop();
        startFollowing();
    });
}

setInterval(() => {
    accountList.map((user) => {
        client.get('users/lookup', {
            screen_name: user.twitterscreenname // eslint-disable-line camelcase
        }, function (error, userObj) {
            if (error) {
                return;
            }

            if (user.iconurl === userObj[0].profile_image_url) {
                return;
            }

            db.updateByScreenName(user.twitterscreenname, userObj[0].profile_image_url);
            db.selectAllUsers().then((res) => {
                accountList = res;
            });

            console.log(`Profile picture for ${user.twitteraccount} updated.`);
        });
    });
}, 43200000);