'use strict';

import Twit from 'twit';
import async from 'async';
import dotenv from 'dotenv';

class TwitterController{
    constructor(){
        this.twitterModule;
    }

    init(){
        return new Promise((resolve, reject) => {
            this.twitterModule = new Twit({
                consumer_key: process.env.TWITTER_CONSUMER_KEY,
                consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
                access_token: process.env.TWITTER_ACCESS_TOKEN,
                access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
                timeout_ms: 60*1000
            });
            resolve();
        });
    }

    async getTimeline(twitterUser){
        await this.init();
        return new Promise((resolve, reject) => {
            this.twitterModule.get('statuses/user_timeline', { screen_name: twitterUser , count: 200 }, (err, data, response) => {
                if(err) {
                    reject({status: 500, msg: 'Twitter API Error', err: err});
                } else {
                    let resTweets = [];
                    async.forEach(data, (tweet, cb) => {
                        let newJson = {
                            "created_at": tweet.created_at,
                            "text": tweet.text,
                            "link": `https://twitter.com/${tweet.user.id_str}/status/${tweet.id_str}`
                        };
                        resTweets.push(newJson);
                    });
                    resolve(resTweets);
                }
            });
        });
    }
}

export default new TwitterController;
