'use strict';

const ENV = process.env.NODE_ENV || 'dev';

const configEnv = (app) => {
    //Log Internal Erros - called from next(err)
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({result: err.msg});
        if(err.err && ENV != 'test') {
            console.error({
                Status: 'Error',
                Message: err.err
            });
        }
        next();
    });
}

export default configEnv;
