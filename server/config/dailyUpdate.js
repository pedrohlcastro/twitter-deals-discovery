'use strict';

import async from 'async';
import TwitterController from '../Controllers/TwitterController';
import WatsonController from '../Controllers/WatsonController';


const ONE_DAY = 86400000;

const dailyUpdate = (timeout=ONE_DAY) => {
    const createCollection = () => {
        const searchUsers = ['hardmob_promo', 'PromobitOficial', 'pelandobr', 'PromoForum'];
        let results = [];
        
        //Search Users timeline tweets
        async.forEach(searchUsers, (user, cb) => {
            TwitterController.getTimeline(user)
                .then((data) => {
                    results = results.concat(data);
                    cb();
                })
                .catch((err) => {
                    cb(err);
                });
        }, (err) => {
            if(err) {
                console.log(err);
            } else {
                // Upload those tweets on Watson Discovery
                WatsonController.uploadFiles(results)
                    .then(() => {
                        console.log('All files uploaded...');
                        setTimeout(() => {
                            WatsonController.deleteCollection()
                                .then(createCollection)
                                .catch(createCollection);
                        }, timeout);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        });
    }
    WatsonController.getCollection()
        .then(() => {
            WatsonController.deleteCollection()
                .then(createCollection)
                .catch(createCollection);
        });
}

export default dailyUpdate;