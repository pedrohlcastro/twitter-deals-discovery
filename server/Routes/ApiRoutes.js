'use strict';

import {Router} from 'express';
import TwitterController from '../Controllers/TwitterController';
import {WatsonController} from '../Controllers/WatsonController';

const router = new Router();

router.get('/result', (req, res, next) => {
    console.log('Log -> Acessando RESULT');
    TwitterController.getTwetts()
        .then((data) => {
            res.json(data);
        })
        .catch((err) => {
            next(err);
        });
});

export default router;
