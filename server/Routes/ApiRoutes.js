'use strict';

import {Router} from 'express';
import async from 'async';

import TwitterController from '../Controllers/TwitterController';
import WatsonController from '../Controllers/WatsonController';

const router = new Router();

router.get('/result', (req, res, next) => {
    const type = req.body.type;
    WatsonController.searchText(type)
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.json(err);
        })
});

router.get('/promotions', (req, res, next) => {
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
            next(err);
        } else {
            // Upload those tweets on Watson Discovery
            WatsonController.uploadFiles(results)
                .then(() => {
                   res.json({status : 'OK'});
                })
                .catch((err) => {
                    next({err})
                });
        }
    });
});

export default router;
