// this is a kind of library we have created our own callback,which might mongoose people will be creating

const jwt = require('jsonwebtoken');
const shortid = require('shortid');
// we should have a string which should not be predicatble by anyone and which is used to decode the token
const secretKey = '8Zz5tw0Ionm3XPZZfN0NOml3z9FMfmpgXwovR9fp6ryDIoGRM8EPHAB6iHsc0fb';

// function for generating a JWT TOKEN
let generateToken = (data,cb) => {
    // cb means callback
    // this is given in the jwt github that how to use it
    try{
        let claims = {
            jwtid: shortid.generate(),
            iat: Date.now(),
		// jwt token has a expiry after 60 hrs * 60 min * 24
            exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24),
            sub: 'authToken',
            iss: 'issueTrackerTool',
            data: data
        };
        // we will get this object in return when we call this method
        let tokenDetails = {
            // here we are generating the token in key value pair,key is token and value is the generated token
            token: jwt.sign(claims,secretKey),
            tokenSecret: secretKey // we don't need to send the secret key to the client which is internal
        };
        // once the tokenDetails is successfull we are sending it to the callback function error = null & data = tokenDetails
        cb(null,tokenDetails);
    }
    catch (err){
        console.log(err);
        // error = err & data = null
        cb(err,null);
    };
};

// function for verifying the token
let verifyClaims = (token,cb) => {
    // verifying token symmetric
    jwt.verify(token,secretKey,function(err,decoded){
        if(err){
            console.log("Error while verifying token");
            console.log(err);
            cb(err,null);
        }
        else{
            console.log("User verified");
            cb(null,decoded);
        };
    });

};

module.exports = {
    generateToken: generateToken,
    verifyClaims: verifyClaims
};
