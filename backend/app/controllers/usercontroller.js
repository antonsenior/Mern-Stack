const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
const tokenLib = require('../libs/tokenLib');
const pug = require('pug')
const path = require('path')
const jwt = require('jsonwebtoken')
const Promise = require('bluebird')

const jwtSign = Promise.promisify(jwt.sign)
const jwtVerify = Promise.promisify(jwt.verify)
const JWT_SECRET_KEY = "aieufasdjcajsdhcwefwtrdyhjcgfh"
var nodeMailer = require('nodemailer');
var transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    tls: { rejectUnauthorized: false },
    auth: {
        user: 'info.clouddefence@gmail.com',
        pass: 'info!123'
    }
});
const User = mongoose.model('User');
const Customer = mongoose.model('Customer');
const tokenCol = mongoose.model('tokenCollection');

let createUser = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.username && req.body.customer_id && req.body.email) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username, email or customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkUser = () => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.find({username: req.body.username, customer_id: req.body.customer_id}, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    resolve();
                } else {
                    logger.error("User Already Exists", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "User Already Exists", 401, null);
                    reject(apiResponse);
                }
            })
        });
    }; // end of checkUser

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Exists", "createUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkUser

    let addUser = (customerDetail) => {
        console.log("addUser");
        return new Promise((resolve, reject) => {
            let body = {
                user_id: shortid.generate(),
                customer_id: req.body.customer_id,
                username: req.body.username,
                first_name: (req.body.first_name) ? (req.body.first_name) : '',
                last_name: (req.body.last_name) ? (req.body.last_name) : '',
                email: req.body.email,
                phone: (req.body.phone) ? (req.body.phone) : '',
                role: (req.body.role) ? (req.body.role) : 'admin',
                status: (req.body.status) ? (req.body.status) : 'Activate',
            };
            if (req.body.password) {
                body['password'] = req.body.password;
            }
            User.create(body, function (err, user) {
                if (err) {
                    logger.error("Internal Server error while create User", "createUser => addUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(user);
                }
            })
        });
    }; // end of addUser

    validatingInputs()
        .then(checkCustomer)
        .then(checkUser)
        .then(addUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let getUser = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.username && req.params.customer_id) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username or customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkUser = () => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.find({username: req.params.username, customer_id: req.params.customer_id}, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    logger.error("User doesnt Exists", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "User doesnt Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(userDetail);
                }
            })
        });
    }; // end of checkUser

    validatingInputs()
        .then(checkUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let loginUser = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.username && req.body.customername && req.body.password) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username or customername or password is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({name: req.body.customername}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "loginUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Exists", "loginUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCustomer

    let checkUser = (customerData) => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.findOne({
                username: req.body.username,
                customer_id: customerData.customer_id
            }, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "loginUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    logger.error("User does not Exists", "loginUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "User does not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    if (userDetail.password && userDetail.password !== '' && userDetail.password !== null) {
                        Promise.all([pwdMatch(userDetail)])
                            .then((data)=>{
                                resolve({user: userDetail, customer: customerData, password: true, tokens: data[0]});
                            })
                            .catch((e)=>{
                                reject(e);
                            })
                    } else {
                        console.log('else data');
                        resolve({user: userDetail,customer: customerData, password: false, tokens: {}});
                    }
                }
            })
        });
    }; // end of checkUser

    let pwdMatch = (userDetails) => {
        console.log("pwdMatch");
        return new Promise((resolve, reject) => {
            let password = req.body.password
            userDetails.comparePassword(password, function (err, match) {
                if (err) {
                    logger.error("Internal Server Error while compare password", "loginUser => pwdMatch()", 5);
                    let apiResponse = response.generate(true, "Internal Server Error while compare password", 500, null);
                    reject(apiResponse);
                } else {
                    if (match === true) {
                        generateToken(userDetails)
                            .then((finaltokens)=>{
                                resolve(finaltokens);
                            })
                            .catch((e)=>{
                                reject(e)
                            })

                    } else {
                        logger.error("Wrong Password", "loginUser => pwdMatch()", 5);
                        let apiResponse = response.generate(true, "Wrong Password", 401, null);
                        reject(apiResponse);
                    }
                }
            });
        });
    } // end of pwdMatch function

    let generateToken = (user) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(user, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "userController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    let finalObject = user.toObject();
                    delete finalObject.__v;
                    tokenDetails.userId = user._id
                    tokenDetails.userDetails = finalObject;
                    saveToken(tokenDetails)
                        .then((savetokenres)=>{
                            resolve(savetokenres);
                        })
                        .catch((e)=>{
                            reject(e)
                        })
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({userId: tokenDetails.userId})
                .exec((err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // player is logging for the first time
                    else if (check.isEmpty(retrieveTokenDetails)) {
                        let newAuthToken = new tokenCol({
                            userId: tokenDetails.userId,
                            authToken: tokenDetails.token,
                            // we are storing this is due to we might change this from 15 days
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenGenerationTime: new Date().getTime()
                        });

                        newAuthToken.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                    // user has already logged in need to update the token
                    else {
                        retrieveTokenDetails.authToken = tokenDetails.token;
                        retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrieveTokenDetails.tokenGenerationTime = new Date().getTime();
                        retrieveTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                delete tokenDetails._id;
                                delete tokenDetails.__v;
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                });
        });

    }; // end of saveToken

    validatingInputs()
        .then(checkCustomer)
        .then(checkUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let passwordUpdate = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.username && req.body.password && req.body.customer_id) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username or password or customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checAndUpdateUser = () => {
        console.log("checAndUpdateUser");
        return new Promise((resolve, reject) => {
            User.findOne({
                username: req.body.username,
                customer_id: req.body.customer_id,
            }, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "passwordUpdate => checAndUpdateUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    logger.error("User does not Exists", "passwordUpdate => checAndUpdateUser()", 5);
                    let apiResponse = response.generate(true, "User does not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    userDetail.password = req.body.password;
                    userDetail.save();
                    generateToken(userDetail)
                        .then((data)=>{
                            resolve({user:userDetail, tokens: data})
                        })
                        .catch((e)=>{
                            reject(e)
                        })
                }
            })
        });
    }; // end of checAndUpdateUser

    let pwdMatch = (userDetails) => {
        console.log("pwdMatch");
        return new Promise((resolve, reject) => {
            let password = req.body.password
            userDetails.comparePassword(password, function (err, match) {
                if (err) {
                    logger.error("Internal Server Error while compare password", "loginUser => pwdMatch()", 5);
                    let apiResponse = response.generate(true, "Internal Server Error while compare password", 500, null);
                    reject(apiResponse);
                } else {
                    if (match === true) {
                        generateToken(userDetails)
                            .then((finaltokens)=>{
                                resolve(finaltokens);
                            })
                            .catch((e)=>{
                                reject(e)
                            })

                    } else {
                        logger.error("Wrong Password", "loginUser => pwdMatch()", 5);
                        let apiResponse = response.generate(true, "Wrong Password", 401, null);
                        reject(apiResponse);
                    }
                }
            });
        });
    } // end of pwdMatch function

    let generateToken = (user) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(user, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "userController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    let finalObject = user.toObject();
                    delete finalObject.__v;
                    tokenDetails.userId = user._id
                    tokenDetails.userDetails = finalObject;
                    saveToken(tokenDetails)
                        .then((savetokenres)=>{
                            resolve(savetokenres);
                        })
                        .catch((e)=>{
                            reject(e)
                        })
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({userId: tokenDetails.userId})
                .exec((err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // player is logging for the first time
                    else if (check.isEmpty(retrieveTokenDetails)) {
                        let newAuthToken = new tokenCol({
                            userId: tokenDetails.userId,
                            authToken: tokenDetails.token,
                            // we are storing this is due to we might change this from 15 days
                            tokenSecret: tokenDetails.tokenSecret,
                            tokenGenerationTime: new Date().getTime()
                        });

                        newAuthToken.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                    // user has already logged in need to update the token
                    else {
                        retrieveTokenDetails.authToken = tokenDetails.token;
                        retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrieveTokenDetails.tokenGenerationTime = new Date().getTime();
                        retrieveTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                delete tokenDetails._id;
                                delete tokenDetails.__v;
                                let responseBody = {
                                    authToken: newTokenDetails.authToken,
                                };
                                resolve(responseBody);
                            }
                        });
                    }
                });
        });

    }; // end of saveToken

    validatingInputs()
        .then(checAndUpdateUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let deleteUser = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.username && req.params.customer_id) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username or customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkUser = () => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.find({
                username: req.params.username,
                customer_id: req.params.customer_id
            }, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "deleteUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("User does not Exists", "deleteUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "User does not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve();
                }
            })
        });
    }; // end of checkUser

    let removeUser = () => {
        console.log("removeUser");
        return new Promise((resolve, reject) => {
            User.findOneAndRemove({
                username: req.params.username,
                customer_id: req.params.customer_id
            }, function (err, user) {
                if (err) {
                    logger.error("Internal Server error while delete user", "deleteUser => removeUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(user);
                }
            })
        });
    }; // end of removeCustomer

    validatingInputs()
        .then(checkUser)
        .then(removeUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send('Received a DELETE HTTP method for username: ' + req.params.username);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
}

let updateUser = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.username && req.body.customer_id) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter username or customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Exists", "createUser => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkUser

    let checkUser = () => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.findOne({username: req.body.username, customer_id: req.body.customer_id}, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    logger.error("User doesn't Exists", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "UUser doesn't Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(userDetail);
                }
            })
        });
    }; // end of checkUser

    let updateUser = (userDetail) => {
        console.log("updateUser");
        return new Promise((resolve, reject) => {
            let body = {
                // customer_id: req.body.customer_id,
                // username: req.body.username,
                first_name: (req.body.first_name) ? (req.body.first_name) : userDetail.first_name,
                last_name: (req.body.last_name) ? (req.body.last_name) : userDetail.last_name,
                email: (req.body.email) ? (req.body.email) : userDetail.email,
                phone: (req.body.phone) ? (req.body.phone) : userDetail.phone
            };
            User.findOneAndUpdate({username: req.body.username, customer_id: req.body.customer_id},body ,{new:true},function (err, user) {
                if (err) {
                    logger.error("Internal Server error while update User", "updateUser => updateUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(user);
                }
            })
        });
    }; // end of addUser

    validatingInputs()
        .then(checkCustomer)
        .then(checkUser)
        .then(updateUser)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let forgetPassword = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.email) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter email is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkUser = () => {
        console.log("checkUser");
        return new Promise((resolve, reject) => {
            User.findOne({email: req.body.email}, function (err, userDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(userDetail)) {
                    logger.error("Email doesn't belong to this User", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "Email doesn't belong to this User", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(userDetail);
                }
            })
        });
    }; // end of checkUser

    let forgetPass = (userDetail) => {
        console.log("forgetPass");
        return new Promise((resolve, reject) => {
            signin(userDetail.email, function (err, token) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(token)) {
                    logger.error("User doesn't Exists", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, "UUser doesn't Exists", 401, null);
                    reject(apiResponse);
                } else {
                    userDetail['token'] = token;
                    userDetail.save();
                    // verifytoken(token)
                    //     .then((data)=>{
                    //         console.log('dataasdas',data);
                    //         resolve(userDetail);
                    //     })
                    //     .catch((e)=>{
                    //         console.log('errasdas', err);
                            resolve(userDetail);
                    //     })
                }
            })
        });
    }; // end of checkUser

    let sendEmail = (userDetail) => {
        console.log("sendEmail", userDetail.token);
        return new Promise((resolve, reject) => {
            let link = req.headers['origin'] + '/register?token='+userDetail.token;
            console.log('link', link);
            let html = pug.renderFile(path.normalize(__dirname + './../template/emailtemplate.pug'), {
                //link: link,
                username: userDetail.username,
                link:link
            });
            let mailOptions = {
                from: 'info.clouddefence@gmail.com',
                to: req.body.email,
                subject: 'Forget Password',
                text: '',
                html: html
            }
            try {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('eeeeeeeeeeerrrrrrrrrr');
                        reject(error);
                        // finalResponse(res, 400, error);
                    } else {
                        userDetail.token = userDetail.token;
                        userDetail.save();
                        let data = {
                            Status: "Success",
                            Message: "Check your email, password reset link has been sent to your email."
                        };
                        resolve(data)
                        // finalResponse(res, 200, data);
                    }
                })
            } catch (e) {
                reject(e);
            }
        });
    }; // end of checkUser

    validatingInputs()
        // .then(checkCustomer)
        .then(checkUser)
        .then(forgetPass)
        .then(sendEmail)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let resetPassword = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.authToken && req.body.password) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter authToken and password is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let verifyToken = () => {
        console.log("verifyToken");
        return new Promise((resolve, reject) => {
            verifytoken(req.body.authToken, function (err, token) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "createUser => checkUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    console.log('token',token)
                    resolve(token)
                }
            })
        });
    }; // end of checkUser

    let updatePass = (userDetail) => {
        console.log("updatePass",userDetail);
        return new Promise((resolve, reject) => {
            let body = {
                // customer_id: req.body.customer_id,
                // username: req.body.username,
                password: req.body.password
            };
            User.findOne({email: userDetail.id} ,function (err, user) {
                if (err) {
                    logger.error("Internal Server error while update User", "updateUser => updateUser()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    user.password = req.body.password;
                    user.save();
                    resolve(user);
                }
            })
        });
    }; // end of addUser

    validatingInputs()
        // .then(checkCustomer)
        .then(verifyToken)
        .then(updatePass)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

const verifytoken = function (token, callback) {
        verify(token)
            .then((data)=>{
                callback(null, data)
            })
            .catch((e)=>{
                callback(e, null)
            })
        //     , function (err, response) {
        //     if (err) {
        //         console.log('err in verifyToken', err)
        //         cb(err, null)
        //     } else {
        //         cb(null, response)
        //     }
        // });
}

const signin = function (userId, cb) {
    sign(userId, function (err, response) {
        if (err) {
            cb(err, null)
        } else {
            cb(null, response)
        }
    });
}

const verify = (token) => {
    return new Promise((resolve, reject) => {
        // console.log('token', token)
            jwtVerify(token, JWT_SECRET_KEY)
                .then((data)=>{
                    resolve(data)
                })
                .catch((e)=>{
                    reject(e)
                })

    })
}

const sign = (id, options, method = jwtSign) => {
    //method({id}, JWT_SECRET_KEY,options)
    method({id}, JWT_SECRET_KEY, {expiresIn: '3600s'}, options)
}


const renderFile = function(path, options, fn){
    // support callback API
    if ('function' == typeof options) {
        fn = options, options = undefined;
    }
    if (typeof fn === 'function') {
        var res;
        try {
            res = exports.renderFile(path, options);
        } catch (ex) {
            return fn(ex);
        }
        return fn(null, res);
    }
    options = options || {};
    options.filename = path;
    return handleTemplateCache(options)(options);
};
module.exports = {
    createUser: createUser,
    getUser: getUser,
    passwordUpdate: passwordUpdate,
    loginUser: loginUser,
    deleteUser: deleteUser,
    updateUser: updateUser,
    forgetPassword: forgetPassword,
    resetPassword: resetPassword,
}
