'use strict';

const { Pool } = require('pg');

class database {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL + '?ssl=true'
        });
    }

    selectAllUsers() {
        return this.pool.connect()
            .then(client => {
                return client.query('SELECT * FROM users')
                    .then(res => {
                        client.release();
                        return res.rows;
                    })
                    .catch(e => {
                        client.release();
                        console.log(e.stack);
                    });
            });
    }

    selectUserByScreenNameAndChannelId(screenName, channelid) {
        return this.pool.connect()
            .then(client => {
                return client.query('SELECT * FROM users WHERE twitterscreenname=$1 AND channelid=$2',
                    [screenName, channelid])
                    .then(res => {
                        client.release();
                        return res.rowCount !== 0 ? true : false;
                    })
                    .catch(e => {
                        client.release();
                        console.log(e.stack);
                    });
            });
    }

    deleteByScreenName(screenName) {
        return this.pool.connect()
            .then(client => {
                return client.query('DELETE FROM users WHERE twitterscreenname=$1', [screenName])
                    .then(res => {
                        client.release();
                        return res.rowCount !== 0 ? true : false;
                    })
                    .catch(e => {
                        client.release();
                        console.log(e.stack);
                    });
            });
    }

    updateByScreenName(screenName, iconURL) {
        return this.pool.connect()
            .then(client => {
                return client.query('UPDATE users SET iconurl=$1 WHERE twitterscreenname=$2', [iconURL, screenName])
                    .then(res => {
                        client.release();
                        return res.rowCount !== 0 ? true : false;
                    })
                    .catch(e => {
                        client.release();
                        console.log(e.stack);
                    });
            });
    }

    insert({ channelid, twitteraccount, twitterscreenname, twitteraccountid, iconurl }) {
        return this.pool.connect()
            .then(client => {
                return client.query('INSERT INTO users(channelid, twitteraccount,\
                     twitterscreenname, twitteraccountid, iconurl) VALUES($1, $2, $3, $4, $5)',
                [channelid, twitteraccount, twitterscreenname.toLowerCase(), twitteraccountid, iconurl])
                    .then(res => {
                        client.release();
                        return res.rowCount !== 0 ? true : false;
                    })
                    .catch(e => {
                        client.release();
                        console.log(e.stack);
                    });
            });
    }
}

module.exports = database;