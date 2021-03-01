const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
var fs = require('fs');

const Display = mongoose.model('Display');
const Customer = mongoose.model('Customer');
const Cluster = mongoose.model('Cluster');


exports.createDisplay = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.customer_id) {
                if (req.body.cluster_name) {
                    if (req.body.display_item) {
                        if (req.body.display_item_value) {
                            resolve();
                        } else {
                            let apiResponse = response.generate(true, "Required Parameter display_item_value is missing", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter display_item is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
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
                    logger.error("Internal Server error while fetching customer", "createDisplay => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "createDisplay => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "createDisplay => checkCustomer()", 5);
                        let apiResponse = response.generate(true, "Customer is inActive", 401, null);
                        reject(apiResponse);
                    }
                }
            })
        });
    }; // end of checkCustomer

    let checkCluster = (customerDetail) => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "createDisplay => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "createDisplay => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCluster

    let checkData = () => {
        console.log("checkData");
        return new Promise((resolve, reject) => {
            Display.find({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                display_item: req.body.display_item
            }, function (err, findDisplayData) {
                if (err) {
                    logger.error("Internal Server error while fetching Display data", "createDisplay => checkData()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(findDisplayData)) {
                    resolve(true)
                } else {
                    resolve(false);
                }
            })
        });
    }; // end of checkData

    let insertData = (flag) => {
        console.log("insertData");
        return new Promise((resolve, reject) => {
            if (flag) {
                console.log("create new");
                let body = {
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    display_item: req.body.display_item,
                    display_item_value: JSON.stringify(req.body.display_item_value),
                };
                Display.create(body, function (err, DisplayData) {
                    if (err) {
                        logger.error("Internal Server error while creating Display data", "createDisplay => insertData()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(DisplayData);
                    }
                })
            } else {
                console.log("Update old");
                Display.findOneAndUpdate({
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    display_item: req.body.display_item
                }, {display_item_value: JSON.stringify(req.body.display_item_value)}, {new: true}, function (err, DisplayData) {
                    if (err) {
                        logger.error("Internal Server error while updating Display data", "createDisplay => insertData()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(DisplayData);
                    }
                })
            }
        });
    }; // end of insertData

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(checkData)
        .then(insertData)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Add Display Data Successfully!!", 200, resolve);
            res.status(200).send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.getDisplay = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.query.customer_id) {
                if (req.query.cluster_name) {
                    if (req.query.display_item) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter display_item is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.query.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getDisplay => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getDisplay => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "getDisplay => checkCustomer()", 5);
                        let apiResponse = response.generate(true, "Customer is inActive", 401, null);
                        reject(apiResponse);
                    }
                }
            })
        });
    }; // end of checkCustomer

    let checkCluster = (customerDetail) => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.query.cluster_name,
                license_key: req.query.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "getDisplay => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "getDisplay => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCluster

    let getDisplayData = () => {
        console.log("getDisplayData");
        return new Promise((resolve, reject) => {
            let query = {
                customer_id: req.query.customer_id,
                display_item: req.query.display_item,
                cluster_name: req.query.cluster_name
            };
            Display.findOne(query, function (err, DisplayData) {
                if (err) {
                    logger.error("Internal Server error while fetching Display data", "getDisplay => getDisplayData()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(DisplayData)) {
                    logger.error("No Record found", "getDisplay => checkCluster()", 5);
                    let apiResponse = response.generate(true, "No Record found", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(DisplayData);
                }
            })


        });
    }; // end of checkCluster

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(getDisplayData)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Get Display Data Successfully!!", 200, resolve);
            res.status(200).send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};
