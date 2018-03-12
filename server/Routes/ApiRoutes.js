'use strict';

import {Router} from 'express';
import async from 'async';

import TwitterController from '../Controllers/TwitterController';
import WatsonController from '../Controllers/WatsonController';

const router = new Router();

router.get('/result', (req, res, next) => {
    // const type = req.body.type;
    WatsonController.searchText()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            res.json(err);
        });
});

export default router;
