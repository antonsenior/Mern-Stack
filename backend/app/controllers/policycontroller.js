const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')

const Customer = mongoose.model('Customer');
const Policy = mongoose.model('Policy');

exports.createPolicy = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.customer_id) {
                if (req.body.policy_body) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter policy_body is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "createPolicy => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "createPolicy => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCustomer

    let checkPolicy = (customerDetail) => {
        console.log("checkPolicy");
        return new Promise((resolve, reject) => {
            Policy.find({customer_id: req.body.customer_id}, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "createPolicy => checkPolicy()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    resolve({newRecord:true});
                } else {
                    /*logger.error("Customer Policy Already Exists", "createPolicy => checkPolicy()", 5);
                    let apiResponse = response.generate(true, "Customer Policy Already Exists", 401, null);
                    reject(apiResponse);*/
                    resolve({newRecord:false});
                }
            })
        });
    }; // end of checkCluster

    let addorUpdatePolicy = (data) => {
        console.log("addorUpdatePolicy");
        return new Promise((resolve, reject) => {
            if(data.newRecord){
                let body = {
                    policy_id: shortid.generate(),
                    customer_id: req.body.customer_id,
                    policy_body: req.body.policy_body,
                };
                Policy.create(body, function (err, policyDetails) {
                    if (err) {
                        logger.error("Internal Server error while create Cluster", "createPolicy => addorUpdatePolicy()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(policyDetails);
                    }
                })
            }else{
                Policy.findOneAndUpdate({customer_id: req.body.customer_id}, {policy_body: req.body.policy_body},{new: true}, function (err, policyDetails) {
                    if (err) {
                        logger.error("Internal Server error while create Cluster", "createPolicy => addorUpdatePolicy()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(policyDetails);
                    }
                })
            }

        });
    }; // end of addCluster

    validatingInputs()
        .then(checkCustomer)
        .then(checkPolicy)
        .then(addorUpdatePolicy)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.getPolicy = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.customer_id) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.params.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getPolicy => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getPolicy => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCustomer

    let checkPolicy = () => {
        console.log("checkPolicy");
        return new Promise((resolve, reject) => {
            Policy.find({customer_id: req.params.customer_id}, function (err, policyDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching user", "getPolicy => checkPolicy()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(policyDetail)) {
                    logger.error("Policy doesnt Exists", "getPolicy => checkPolicy()", 5);
                    let apiResponse = response.generate(true, "Policy doesnt Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(policyDetail);
                }
            })
        });
    }; // end of checkUser

    validatingInputs()
        .then(checkCustomer)
        .then(checkPolicy)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};
