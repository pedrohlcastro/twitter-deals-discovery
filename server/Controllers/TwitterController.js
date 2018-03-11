'use strict';

import Twit from 'twit';
import async from 'async';

class TwitterController{
    constructor(){
        this.twitterModule = new Twit({
            consumer_key: 'Laf9GjEnqFqI2GHkw79FcxMBz',
            consumer_secret: 'ZuXIe9uoKsjXdyKXw2Q0eGlauXfVG4RotfxVRX2MEGaM9SSsh1',
            access_token: '283773756-kgKmjksH7xWWci9FfinCX9GfS06b78s236hzavHK',
            access_token_secret: '7ZHDamSq3Uv9jEJvNEORipTc14NKaaqlXRSrAH3i7mjhI',
            timeout_ms: 60*1000
        });
    }

    getTwetts(){
        return new Promise((resolve, reject) => {
            this.twitterModule.get('search/tweets', { q: 'Notebook promoção since:2018-03-05', count: 100 }, (err, data, response) => {
                if(err) {
                    reject({status: 500, msg: 'Twitter API Error', err: err});
                } else {
                    let resTweets = [];
                    async.forEach(data.statuses, (tweet, cb) => {
                        let newJson = {
                            created_at: tweet.created_at,
                            text: tweet.text,
                            link: `https://twitter.com/${tweet.user.id_str}/status/${tweet.id_str}`
                        };
                        resTweets.push(newJson);
                    });
                    resolve(resTweets);
                }
            });
        });
    }

    getTimeline(twitterUser){
        return new Promise((resolve, reject) => {
            this.twitterModule.get('statuses/user_timeline', { screen_name: twitterUser , count: 100 }, (err, data, response) => {
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
