const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AuthModel = mongoose.model('tokenCollection');

const logger = require('./../libs/loggerLib');
const response = require('./../libs/responseLib');
const token = require('./../libs/tokenLib');
const check = require('./../libs/checkLib');

let isAuthorize = (req, res, next) => {
    console.log("isAuthorize");
    if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {
        AuthModel.findOne({authToken: req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')}).exec((err, authDetails) => {
            if (err) {
                console.log(err);
                logger.error(err.message, 'AuthorizationMiddleware', 10);
                let apiResponse = response.generate(true, 'Failed To Authorized', 500, null);
                res.status(401).send(apiResponse);
            } else if (check.isEmpty(authDetails)) {
                logger.error('User logged out already or user not registered', 'AuthorizationMiddleware', 10);
                let apiResponse = response.generate(true, 'User logged out already or user not registered', 500, null);
                res.status(401).send(apiResponse);
            } else {
                token.verifyClaims(authDetails.authToken, (err, decoded) => {
                    if (err) {
                        logger.error(err.message, 'Authorization Middleware', 10);
                        let apiResponse = response.generate(true, 'Failed To Authorized', 500, null);
                        res.status(401).send(apiResponse);
                    } else {
                        // console.log('decoded',decoded)
                        // res.send(decoded.data)
                        req.user = decoded.data;
                        next();
                    }
                });
            }
        });
    } else {
        let apiResponse = response.generate(true, 'Auth Token is missing', 404, null);
        res.status(401).send(apiResponse);
    }

}; // end of isAuthorize

let joinRoom = (req, res, next) => {
    console.log("joinRoom");
    if(req.app.socket) {
        let socket = req.app.socket;
        console.log('userDetail.customer_id', socket.id, req.user.customer_id);
        socket.join(req.user.customer_id);
        next();
    } else {
        next();
    }

}; // end of isAuthorize

module.exports = {
    isAuthorize: isAuthorize,
    joinRoom: joinRoom
};
