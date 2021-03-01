const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
var fs = require('fs');

const ResourceHistory = mongoose.model('ResourceHistory');
const Customer = mongoose.model('Customer');
const Cluster = mongoose.model('Cluster');

exports.createRecord = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.customer_id) {
                if (req.body.cluster_name) {
                    if (req.body.nodes) {
                        if (req.body.pods) {
                            if (req.body.services) {
                                if (req.body.cnox_pods) {
                                    if (req.body.cnox_services) {
                                        if (req.body.cnox_cpu) {
                                            if (req.body.cnox_mem) {
                                                if (req.body.node_summary_json) {
                                                    resolve();
                                                } else {
                                                    let apiResponse = response.generate(true, "Required Parameter node_summary_json is missing", 400, null);
                                                    reject(apiResponse);
                                                }
                                            } else {
                                                let apiResponse = response.generate(true, "Required Parameter cnox_mem is missing", 400, null);
                                                reject(apiResponse);
                                            }
                                        } else {
                                            let apiResponse = response.generate(true, "Required Parameter cnox_cpu is missing", 400, null);
                                            reject(apiResponse);
                                        }
                                    } else {
                                        let apiResponse = response.generate(true, "Required Parameter cnox_services is missing", 400, null);
                                        reject(apiResponse);
                                    }
                                } else {
                                    let apiResponse = response.generate(true, "Required Parameter cnox_pods is missing", 400, null);
                                    reject(apiResponse);
                                }
                            } else {
                                let apiResponse = response.generate(true, "Required Parameter services is missing", 400, null);
                                reject(apiResponse);
                            }
                        } else {
                            let apiResponse = response.generate(true, "Required Parameter pods is missing", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter nodes is missing", 400, null);
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
                    logger.error("Internal Server error while fetching customer", "createRecord => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "createRecord => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve();
                    } else {
                        logger.error("Customer is inActive", "createRecord => checkCustomer()", 5);
                        let apiResponse = response.generate(true, "Customer is inActive", 401, null);
                        reject(apiResponse);
                    }
                }
            })
        });
    }; // end of checkCustomer

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "createRecord => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster is not Exists", "createRecord => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster is not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve();
                }
            })
        });
    }; // end of checkCluster

    let addRecord = () => {
        console.log("addCluster");
        return new Promise((resolve, reject) => {
            let body = {
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                nodes: req.body.nodes,
                pods: req.body.pods,
                services: req.body.services,
                cnox_pods: req.body.cnox_pods,
                cnox_services: req.body.cnox_services,
                cnox_cpu: req.body.cnox_cpu,
                cnox_mem: req.body.cnox_mem,
                node_resource_json: JSON.stringify(req.body.node_resource_json)
            };
            ResourceHistory.create(body, function (err, recordResult) {
                if (err) {
                    logger.error("Internal Server error while create Resource History record", "createRecord => ResourceHistory()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(recordResult);
                }
            })
        });
    }; // end of addRecord

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(addRecord)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Resource History Created Successfully!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};
