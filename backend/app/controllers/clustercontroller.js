const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib');
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib');
var fs = require('fs');

const ReportHistory = mongoose.model('ReportHistory');
const Customer = mongoose.model('Customer');
const Cluster = mongoose.model('Cluster');
const Logtable = mongoose.model('Logtable');
const Reports = mongoose.model('reports');

const findSocketTotalunseccluster = function (req, customer_id) {
    console.log('==== update Socket start ==== ');
    console.log('findSocketTotalunseccluster ');
    const socket = req.app.io;
    return new Promise((resolve, reject) => {
        Cluster.find({cnox_stack: {$in: ['', 'unsecured']}, license_key: customer_id}).exec((err, result) => {
            if (err) throw err;
            if (socket !== undefined) {
                socket.to(customer_id).emit('unseccluster', result);
            }
            resolve(result);
        });
    })
}
const findSocketTotalStackList = function (req, customer_id) {
    console.log('findSocketTotalStackList ');
    const socket = req.app.io;
    return new Promise((resolve, reject) => {
        Cluster.find({cnox_stack: {$nin: ['', null, 'unsecured']}, license_key: customer_id}).exec((err, result) => {
            if (err) throw err;
            let gold_stack = 0;
            let silver_stack = 0;
            let bronze_stack = 0;
            let totalgoldNodes = 0;
            let totalsilverNodes = 0;
            let totalbronzeNodes = 0;
            result.filter((x) => {
                if (x.cnox_stack === 'gold_stack') {
                    gold_stack++;
                    totalgoldNodes += Number(x.Nodes)
                } else if (x.cnox_stack === 'silver_stack') {
                    silver_stack++;
                    totalsilverNodes += Number(x.Nodes)
                } else if (x.cnox_stack === 'bronze_stack') {
                    bronze_stack++
                    totalbronzeNodes += Number(x.Nodes)
                }
            })
            let gold = {
                Totalstack: gold_stack,
                TotalNodes: totalgoldNodes,

            }
            let silver = {
                Totalstack: silver_stack,
                TotalNodes: totalsilverNodes,

            }
            let bronze = {
                Totalstack: bronze_stack,
                TotalNodes: totalbronzeNodes,

            }
            result = {
                Gold: gold,
                Silver: silver,
                Bronze: bronze
            }
            if (socket !== undefined) {
                socket.to(customer_id).emit('list', result);
            }
            resolve(result);
        });
    })
}
const findSocketLogEvent = function (req, customer_id) {
    console.log('findSocketLogEvent ');
    return new Promise((resolve, reject) => {
        const socket = req.app.io;
        Logtable.find({customer_id: customer_id}).sort({timestamp: -1}).exec((err, result) => {
            if (err) throw err;
            if (socket !== undefined) {
                socket.to(customer_id).emit('logs', result);
            }
            resolve(result);
        });
    })
}
const findSocketAllTotal = function (req, customer_id) {
    console.log('findSocketAllTotal ');
    return new Promise((resolve, reject) => {
        const socket = req.app.io;
        Cluster.find({license_key: customer_id}).exec((err, result) => {
            if (err) throw err;
            let totalNodes = 0;
            let totalPods = 0;
            let totalServices = 0;
            result.filter((x) => {
                totalNodes += Number(x.Nodes)
                totalPods += Number(x.Pods)
                totalServices += Number(x.Services)
            })
            result = {
                TotalNodes: totalNodes,
                TotalPods: totalPods,
                TotalServices: totalServices
            }
            if (socket !== undefined) {
                socket.to(customer_id).emit('totals', result);
            }
            resolve(result);
        });
    });
}
const findSocketAllcluster = function (req, customer_id) {
    console.log('findSocketAllcluster ');
    return new Promise((resolve, reject) => {
        const socket = req.app.io;
        Cluster.find({license_key: customer_id}).exec((err, result) => {
            if (err) throw err;
            if (socket !== undefined) {
                socket.to(customer_id).emit('cluster', result);
            }
            resolve(result);
            console.log('==== End Socket ==== ');
        });
    });
}

const emitAppComplianceReport = function (req, customer_id, final) {
    console.log('emitAppComplianceReport ');
    console.log('==== Start Socket Process ==== ');
    return new Promise((resolve, reject) => {
        const socket = req.app.io;
        Cluster.find({license_key: customer_id}).exec((err, result) => {
            if (err) throw err;
            if (socket !== undefined) {
                socket.to(customer_id).emit('AppComplianceReport', final);
            }
            resolve(result);
            console.log('==== End Socket Process ==== ');
        });
    });
}

exports.createCluster = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.license_key) {
                if (req.body.cluster_name) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter license_key is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.license_key}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "createCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "createCluster => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "createCluster => checkCustomer()", 5);
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
            Cluster.find({cluster_name: req.body.cluster_name, license_key: req.body.license_key}, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "createCustomer => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    resolve(customerDetail);
                } else {
                    logger.error("Cluster Already Exists", "createCluster => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Already Exists", 401, null);
                    reject(apiResponse);

                }
            })
        });
    }; // end of checkCluster

    let addCluster = (customerDetail) => {
        console.log("addCluster");
        return new Promise((resolve, reject) => {
            let body = {
                cluster_name: req.body.cluster_name,
                cnox_stack: req.body.cnox_stack,
                cnox_engine_url: req.body.cnox_engine_url,
                Nodes: req.body.Nodes,
                license_key: customerDetail.customer_id,
                Pods: req.body.Pods,
                Services: req.body.Services,
                monitor_url: req.body.monitor_url,
                scanner_url: req.body.scanner_url,
                compliance_url: req.body.compliance_url
            };
            Cluster.create(body, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while create Cluster", "addCluster => addCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of addCluster

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(addCluster)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            Promise.all([findSocketTotalunseccluster(req, req.body.license_key), findSocketTotalStackList(req, req.body.license_key), findSocketAllTotal(req, req.body.license_key), findSocketLogEvent(req, req.body.license_key), findSocketAllcluster(req, req.body.license_key)])
                .then((data) => {
                    res.status(200).send(resolve);
                })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.putCnoxEngineUrl = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.cnox_engine_url) {
                    if (req.body.customer_id) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cnox_engine_url is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOne({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "putCnoxEngineUrl => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster not found", "putCnoxEngineUrl => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster not found", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, {cnox_engine_url: req.body.cnox_engine_url}, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while Update Cluster", "putCnoxEngineUrl => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of addCluster

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
                .then((data) => {
                    res.status(200).send(resolve);
                })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.updatecnoxstack = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.cnox_stack) {
                    if (req.body.customer_id) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cnox_stack is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "updatecnoxstack => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "updatecnoxstack => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, {cnox_stack: req.body.cnox_stack}, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "updatecnoxstack => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    let updateSocket = (finalRes) => {
        console.log("updateSocket");
        return new Promise((resolve, reject) => {
            let socket = req.app.io;
            if (socket && socket !== undefined) {
                socket.to(finalRes.license_key).emit('updatecnoxstack', finalRes);
            }
            resolve(finalRes);
        });
    }; // end of updateSocket

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then(updateSocket)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
                .then((data) => {
                    res.status(200).send(resolve);
                })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.updatemonitorurl = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.monitor_url) {
                    if (req.body.customer_id) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter monitor_url is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "updatemonitorurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "updatemonitorurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, {monitor_url: req.body.monitor_url}, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "updatemonitorurl => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    let updateSocket = (finalRes) => {
        console.log("updateSocket");
        return new Promise((resolve, reject) => {
            let socket = req.app.io;
            if (socket && socket !== undefined) {
                socket.to(finalRes.license_key).emit('updatemonitorurl', finalRes);
                socket.to(finalRes.license_key).emit('update-cluster', {
                    message: 'update monitor url',
                    customer_id: finalRes.license_key,
                    percentage: 33.33,
                    cluster_name: finalRes.cluster_name
                });
            }
            resolve(finalRes);
        });
    }; // end of updateSocket

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then(updateSocket)
        .then((resolve) => {
            res.status(200).send(resolve);
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            // Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
            //     .then((data) => {
            //         res.status(200).send(resolve);
            //     })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });

};

exports.updatescannerurl = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.scanner_url) {
                    if (req.body.customer_id) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter scanner_url is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "updatescannerurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "updatescannerurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, {scanner_url: req.body.scanner_url}, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "updatescannerurl => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    let updateSocket = (finalRes) => {
        console.log("updateSocket");
        return new Promise((resolve, reject) => {
            let socket = req.app.io;
            if (socket && socket !== undefined) {
                socket.to(finalRes.license_key).emit('updatescannerurl', finalRes);
                socket.to(finalRes.license_key).emit('update-cluster', {
                    message: 'update scanner url',
                    customer_id: finalRes.license_key,
                    percentage: 33.33,
                    cluster_name: finalRes.cluster_name
                });
            }
            resolve(finalRes);
        });
    }; // end of updateSocket

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then(updateSocket)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
            // Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
            //     .then((data) => {
            //         res.status(200).send(resolve);
            //     })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.updatecomplianceurl = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.compliance_url) {
                    if (req.body.customer_id) {
                        resolve();
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter compliance_url is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "updatecomplianceurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "updatecomplianceurl => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, {compliance_url: req.body.compliance_url}, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "updatecomplianceurl => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    let updateSocket = (finalRes) => {
        console.log("updateSocket");
        return new Promise((resolve, reject) => {
            let socket = req.app.io;
            if (socket && socket !== undefined) {
                socket.to(finalRes.license_key).emit('updatecomplianceurl', finalRes);
                socket.to(finalRes.license_key).emit('update-cluster', {
                    message: 'update compliance url',
                    customer_id: finalRes.license_key,
                    percentage: 33.33,
                    cluster_name: finalRes.cluster_name
                });
            }
            resolve(finalRes);
        });
    }; // end of updateSocket


    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then(updateSocket)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
            // Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
            //     .then((data) => {
            //         res.status(200).send(resolve);
            //     })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.updatecount = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.nodes && req.body.pods && req.body.services && req.body.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter nodes or pods or services or customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "updatecount => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "updatecount => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndUpdate({cluster_name: req.params.cluster_name, license_key: req.body.customer_id}, {
                Nodes: req.body.nodes,
                Pods: req.body.pods,
                Services: req.body.services
            }, {new: true}, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "updatecount => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            console.log('res', resolve.license_key);
            Promise.all([findSocketTotalunseccluster(req, resolve.license_key), findSocketTotalStackList(req, resolve.license_key), findSocketAllTotal(req, resolve.license_key), findSocketLogEvent(req, resolve.license_key), findSocketAllcluster(req, resolve.license_key)])
                .then((data) => {
                    res.status(200).send(resolve);
                })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.createlogevent = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
                if (req.body.log_string) {
                    // if (req.body.customer_id) {
                        // if (req.body.cluster_name) {
                        if (req.body.priority) {
                            resolve();
                        } else {
                            let apiResponse = response.generate(true, "Required Parameter priority is missing", 400, null);
                            reject(apiResponse);
                        }
                        // } else {
                        //     let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                        //     reject(apiResponse);
                        // }
                    // } else {
                    //     let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    //     reject(apiResponse);
                    // }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter log_string is missing", 400, null);
                    reject(apiResponse);
                }
            }
        );
    }; // end of validatingInputs

    let addLogtable = () => {
        console.log("addLogtable");
        return new Promise((resolve, reject) => {
            var timestamp = new Date();
            Logtable.create({
                timestamp: timestamp,
                log_string: req.body.log_string,
                customer_id: (req.body.customer_id)?req.body.customer_id:"",
                cluster_name: (req.body.cluster_name) ? req.body.cluster_name : "",
                priority: req.body.priority
            }, function (err, logtableDetails) {
                if (err) {
                    logger.error("Internal Server error while create Logtable", "createlogevent => addLogtable()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(logtableDetails);
                }
            })
        });
    }; // end of updateCluster

    validatingInputs()
        .then(addLogtable)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            Promise.all([findSocketTotalunseccluster(req, req.body.customer_id), findSocketTotalStackList(req, req.body.customer_id), findSocketAllTotal(req, req.body.customer_id), findSocketLogEvent(req, req.body.customer_id), findSocketAllcluster(req, req.body.customer_id)])
                .then((data) => {
                    res.status(200).send(resolve);
                })

        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });

};

exports.findAllcluster = (req, res) => {
    const socket = req.app.io;
    let customer_id = req.user.customer_id;
    const query = {license_key: customer_id};
    if(req.query.status){
        query['cnox_stack'] = req.query.status;
    }
    Cluster.find(query).exec((err, result) => {
        if (err) throw err;
        if (socket !== undefined) {
            socket.to(customer_id).emit('cluster', result);
        }
        return res.send(result);
    });

};

exports.findunseccluster = (req, res) => {
    const socket = req.app.io;
    let customer_id = req.user.customer_id;
    Cluster.find({cnox_stack: {$in: ['', 'unsecured']}, license_key: customer_id}).exec((err, result) => {
        if (err) throw err;
        if (socket !== undefined) {
            socket.to(customer_id).emit('unseccluster', result);

        }
        return res.send(result);
    });

};

exports.findAlllogevent = (req, res) => {
    const socket = req.app.io;
    let customer_id = req.user.customer_id;
    Logtable.find({customer_id: customer_id}).sort({timestamp: -1})
        .exec((err, result) => {
            if (err) throw err;
            if (socket !== undefined) {
                socket.to(customer_id).emit('logs', result);
            }
            return res.send(result);
        });
};

exports.findAlltotals = (req, res) => {
    const socket = req.app.io;
    let customer_id = req.user.customer_id;
    Cluster.find({license_key: customer_id}).exec((err, result) => {
        if (err) throw err;
        let totalNodes = 0;
        let totalPods = 0;
        let totalServices = 0;
        result.filter((x) => {
            totalNodes += Number(x.Nodes)
            totalPods += Number(x.Pods)
            totalServices += Number(x.Services)
        })
        result = {
            TotalNodes: totalNodes,
            TotalPods: totalPods,
            TotalServices: totalServices
        }
        if (socket !== undefined) {
            socket.to(customer_id).emit('totals', result);
        }
        return res.send(result);
    });

};

exports.findAllstacklist = (req, res) => {
    const socket = req.app.io;
    let customer_id = req.user.customer_id;
    Cluster.find({cnox_stack: {$nin: ['', null, 'unsecured']}, license_key: customer_id}).exec((err, result) => {
        if (err) throw err;
        let gold_stack = 0;
        let silver_stack = 0;
        let bronze_stack = 0;
        let totalgoldNodes = 0;
        let totalsilverNodes = 0;
        let totalbronzeNodes = 0;
        result.filter((x) => {
            if (x.cnox_stack === 'gold_stack') {
                gold_stack++;
                totalgoldNodes += Number(x.Nodes)
            } else if (x.cnox_stack === 'silver_stack') {
                silver_stack++;
                totalsilverNodes += Number(x.Nodes)
            } else if (x.cnox_stack === 'bronze_stack') {
                bronze_stack++
                totalbronzeNodes += Number(x.Nodes)
            }
        })
        let gold = {
            Totalstack: gold_stack,
            TotalNodes: totalgoldNodes,

        }
        let silver = {
            Totalstack: silver_stack,
            TotalNodes: totalsilverNodes,

        }
        let bronze = {
            Totalstack: bronze_stack,
            TotalNodes: totalbronzeNodes,

        }
        result = {
            Gold: gold,
            Silver: silver,
            Bronze: bronze
        }
        if (socket !== undefined) {
            socket.to(customer_id).emit('list', result);
        }
        return res.send(result);
    });

};

exports.deleteCluster = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.body.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.find({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "deleteCluster => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "deleteCluster => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = () => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOneAndRemove({
                cluster_name: req.params.cluster_name,
                license_key: req.body.customer_id
            }, function (err, clusterdetails) {
                if (err) {
                    logger.error("Internal Server error while update Cluster", "deleteCluster => updateCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterdetails);
                }
            })
        });
    }; // end of updateCluster

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then((resolve) => {
            res.status(200).send('Received a DELETE HTTP method' + req.params.cluster_name);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.deleteCnoxStack = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.params.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCluster = () => {
        console.log("checkCluster");
        return new Promise((resolve, reject) => {
            Cluster.findOne({cluster_name: req.params.cluster_name,
                license_key: req.params.customer_id}, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "deleteCluster => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "deleteCluster => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let updateCluster = (clusterData) => {
        console.log("updateCluster");
        return new Promise((resolve, reject) => {
            clusterData.cnox_stack = 'Stack delete in progress';
            clusterData.save();
            resolve(clusterData)
        });
    }; // end of updateCluster

    validatingInputs()
        .then(checkCluster)
        .then(updateCluster)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let reportHistory = (resolveData) => {
    console.log("reportHistory");
    return new Promise((resolve, reject) => {
        const json = {
            customer_id: resolveData.customer_id,
            cluster_name: resolveData.cluster_name,
            report_type: resolveData.report_type,
            timestamp: new Date(),
            summary_json: resolveData.summary_json,
        };
        console.log('json', json);

        ReportHistory.create(json, function (err, reportEntry) {
            if (err) {
                console.log('err', err);
                logger.error("Internal Server error while creating Report History", "workloadcompliancereport => reportHistory()", 5);
                let apiResponse = response.generate(true, err, 500, null);
                reject(apiResponse);
            } else {
                resolve(resolveData)
            }
        })
    });
}; // end of reportHistory

// work load compliance Report
exports.workloadcompliancereport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
                if (req.body.cluster_name) {
                    if (req.body.customer_id) {
                        if (req.body.report_type) {
                            if (req.body.report_type === 'workload_compliance') {
                                if (req.file) {
                                    resolve();
                                } else {
                                    let apiResponse = response.generate(true, "Required Parameter 'raw_report' file is missing", 400, null);
                                    reject(apiResponse);
                                }
                            } else {
                                let apiResponse = response.generate(true, "Wrong value for report_type", 400, null);
                                reject(apiResponse);
                            }
                        } else {
                            let apiResponse = response.generate(true, "Required Parameter report_type is missing", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                    reject(apiResponse);
                }
            }
        );
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "reportprocessing => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "reportprocessing => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "reportprocessing => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id,
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "reportprocessing => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "reportprocessing => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let readFile = () => {
        console.log("readFile");
        return new Promise((resolve, reject) => {

            fs.readFile(req.file.path, 'utf8', function (err, data) {
                if (err) throw err;
                // console.log(data);
                resolve(data)
            });
        });
    }; // readFile

    let ProcessData = (string) => {
        console.log("ProcessData");
        return new Promise((resolve, reject) => {
            // Namespaces to filter
            let filterOutNamespaces = ['cnox', 'monitoring', 'scanner', 'cnox-compliance'];

            // Start Summary JSON for Report
            const convert_level_UpperLetter = (msg) => {
                switch (msg) {
                    case 'info':
                        return 'I';
                    case 'error':
                        return 'E';
                    case 'warning':
                        return 'W';
                    default:
                        return 'O';
                }
            }

            const result = {
                all: {
                    E: 0,
                    W: 0,
                    I: 0,

                }
            };

            (string).split("time").filter(line => {
                return line.trim() && line.trim().length && line.includes('Name=') ? true : false
            }).map(line => {
                const resObj = {};
                const lineStr = ('time' + line);
                const addExpTest = (attr) => {
                    const item_attr = attr.split('=');
                    const regExp = new RegExp('"([^"]+)["]*', 'g');
                    const val = item_attr[1].replace(regExp, '$1');
                    resObj[item_attr[0]] = val;
                }
                const regExp1 = new RegExp('([A-Za-z]+)="([^"]+)"', 'g');
                lineStr.match(regExp1).map((res) => {
                    addExpTest(res);
                });

                const regExp2 = new RegExp('([A-Za-z]+)=([^\\s]+)', 'g');
                lineStr.match(regExp2).map((res) => {
                    addExpTest(res);
                });

                return resObj;
            }).forEach(item => {
                // Filter CNOX related entries
                if ('Namespace' in item && filterOutNamespaces.findIndex(ns => ns === item['Namespace']) >= 0) return;

                const itemName = item['Name'];
                const level = convert_level_UpperLetter(item['level']);
                if (!(itemName in result)) {
                    result[itemName] = {
                        E: 0,
                        I: 0,
                        W: 0
                    }
                }
                result[itemName][level]++;
                result.all[level]++;
            });
            // End Summary JSON for Report

            // Start Recommend JSON
            let reportArr = [];

            // Make an JSON from the Report
            (string).split("time").filter(line => {
                return line.trim() && line.trim().length && line.includes('KubeType=') ? true : false
            }).map(line => {
                const resObj = {};
                const lineStr = ('time' + line);
                const addExpTest = (attr) => {
                    const item_attr = attr.split('=');
                    const regExp = new RegExp('"([^"]+)["]*', 'g');
                    const val = item_attr[1].replace(regExp, '$1');
                    resObj[item_attr[0]] = val;
                }
                const regExp = new RegExp('([A-Za-z]+)(=)([^" \n]+)', 'g');
                const newStr = lineStr.replace(regExp,'$1$2"$3" ')

                const regExp1 = new RegExp('([A-Za-z]+)="([^"]+)"', 'g');
                newStr.match(regExp1).map((res) => {
                addExpTest(res);
                });

                reportArr.push(resObj);
                return resObj;
            });

            let result_for_recommend = [];

            reportArr.forEach(report => {
                // Skip CNOX related entries
                if ('Namespace' in report && filterOutNamespaces.findIndex(ns => ns === report['Namespace']) >= 0) return;

                let msgIndex = result_for_recommend.findIndex(item => item.msg === report.msg);
                if (msgIndex < 0) {
                    result_for_recommend.push({
                        msg: report.msg,
                        level: report.level,
                        TypeCount: {
                            pod: 0,
                            daemonSet: 0,
                            deployment: 0,
                            namespace: 0
                        }
                    });
                    msgIndex = result_for_recommend.length - 1;
                }
                if (report.KubeType in result_for_recommend[msgIndex].TypeCount) {
                    result_for_recommend[msgIndex].TypeCount[report.KubeType]++;
                }
            });
            // End Recommend JSOn

            fs.unlinkSync(req.file.path,)
            resolve([string, result, result_for_recommend]);
        });
    }; // ProcessData

    let findOldRecord = (processData) => {
        console.log("findoldRecord");
        return new Promise((resolve, reject) => {
            const body = {};
            let json = JSON.stringify(processData[1]);
            let recommend_json = JSON.stringify(processData[2]);
            let newJson = JSON.parse(json);
            body['customer_id'] = req.body.customer_id;
            body['cluster_name'] = req.body.cluster_name;
            body['report_type'] = req.body.report_type;
            body['timestamp'] = +new Date();
            body['summary_json'] = json;
            body['recommend_json'] = recommend_json;
            body['raw_report'] = processData[0].toString();

            Reports.findOne({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                report_type: 'workload_compliance',
            }, function (err, reportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "reportprocessing => findoldRecord()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(reportData)) {
                    body['report_id'] = shortid.generate();
                    resolve([body, 'new']);
                } else {
                    resolve([body, 'update']);
                }
            })
        });
    };

    let CreateRecord = (inputs) => {
        console.log("CreateRecord");
        return new Promise((resolve, reject) => {
            if (inputs[1] === 'new') {
                console.log("create new");
                Reports.create(inputs[0], function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while creating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            } else {
                console.log("update");
                Reports.findOneAndUpdate({
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    report_type: 'workload_compliance',
                }, inputs[0], {new: true}, function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while updating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            }
        });
    }; // end of CreateRecord

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(readFile)
        .then(ProcessData)
        .then(findOldRecord)
        .then(CreateRecord)
        .then(reportHistory)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            fs.unlinkSync(req.file.path,)
            res.status(err.status).send(err);
        });
};

exports.getWorkLoad = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            console.log('raw_report', req.params)
            if (req.params.cluster_name) {
                if (req.params.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.params.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "getWorkLoad => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.params.cluster_name,
                license_key: req.params.customer_id,
            }, function (err, clusterDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterDetail)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve({clusterData: clusterDetail, customerData: customerDetail});
                }
            })
        });
    }; // end of checkCluster

    let findWorkLoad = (data) => {
        console.log("findWorkLoad");
        return new Promise((resolve, reject) => {
            Reports.find({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'workload_compliance',
            }, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "getWorkLoad => findWorkLoad()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(ReportData)) {
                    logger.error("Report Not Exists", "getWorkLoad => findWorkLoad()", 5);
                    let apiResponse = response.generate(true, "Report Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    (ReportData).filter((x) => {
                        x = x.toObject();
                    })
                    data['ReportData'] = ReportData;
                    resolve(data);
                }
            })
        });
    }; // end of findWorkLoad

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(findWorkLoad)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.deleteWorkLoad = (req, res) => {

    let findWorkLoad = () => {
        console.log("findWorkLoad");
        return new Promise((resolve, reject) => {
            Reports.findOneAndDelete({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'workload_compliance',
            }, {}, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while delete Report", "getWorkLoad => findWorkLoad()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(ReportData);
                }
            })
        });
    }; // end of findWorkLoad

    findWorkLoad()
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

//End work load compliance Report


//cluster compliance Report

exports.clustercompliancereport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            console.log('raw_report', req.body)
            if (req.body.cluster_name) {
                if (req.body.customer_id) {
                    if (req.body.report_type) {
                        if (req.body.report_type === 'cluster_compliance') {
                            if (req.body.raw_report) {
                                resolve();
                            } else {
                                let apiResponse = response.generate(true, "Required Parameter raw_report is missing", 400, null);
                                reject(apiResponse);
                            }
                        } else {
                            let apiResponse = response.generate(true, "Wrong value for report_type", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter report_type is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "clustercompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "clustercompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "clustercompliancereport => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id,
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let ProcessData = () => {
        console.log("ProcessData");
        return new Promise((resolve, reject) => {
            const convert_level_upperletter = (check_string) => {
                switch (check_string) {
                    case 'PASS':
                        return 'P';
                    case 'FAIL':
                        return 'F';
                    case 'WARN':
                        return 'W';
                    case 'INFO':
                        return 'I';
                    default:
                        return 'O';
                }
            }
            // Result Object
            const result = {
                All: {
                    P: 0,
                    F: 0,
                    W: 0,
                    I: 0
                }
            }
            // Analysis of Report

            if (!req.body.raw_report || !req.body.raw_report.nodes || req.body.raw_report.nodes.length < 1) {
                reject({status: 404, msg: 'raw_report is not in a proper form of json'})
            } else {
                req.body.raw_report.nodes.forEach(node => {
                    const nodeName = node.name;
                    const summariesArr = node.report.split('== Summary ==')[1].split('\n');
                    const resultItem = {};

                    summariesArr.forEach(line => {
                        // Remove Space
                        line = line.trim();

                        if (line) {
                            const lineWords = line.split(' ');
                            const itemName = convert_level_upperletter(lineWords[2]);
                            resultItem[itemName] = +lineWords[0];
                        }
                    });

                    result[nodeName] = resultItem;
                    // Summing Items
                    Object.keys(resultItem).forEach(key => {
                        result.All[key] += resultItem[key];
                    });
                });
                // console.log(result)
                resolve(result);
            }


        });
    }; // ProcessData

    let findOldRecord = (processData) => {
        console.log("findoldRecord");
        return new Promise((resolve, reject) => {
            let body = {};
            body['customer_id'] = req.body.customer_id;
            body['cluster_name'] = req.body.cluster_name;
            body['report_id'] = shortid.generate();
            body['report_type'] = req.body.report_type;
            body['timestamp'] = +new Date();
            body['summary_json'] = JSON.stringify(processData);
            body['raw_report'] = JSON.stringify(req.body.raw_report);

            Reports.findOne({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                report_type: 'cluster_compliance',
            }, function (err, reportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "reportprocessing => findoldRecord()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(reportData)) {
                    body['report_id'] = shortid.generate();
                    resolve([body, 'new']);
                } else {
                    resolve([body, 'update']);
                }
            })
        });
    };

    let CreateRecord = (inputs) => {
        console.log("CreateRecord");
        return new Promise((resolve, reject) => {
            if (inputs[1] === 'new') {
                console.log("create new");
                Reports.create(inputs[0], function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while creating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            } else {
                console.log("update");
                Reports.findOneAndUpdate({
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    report_type: 'cluster_compliance',
                }, inputs[0], {new: true}, function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while updating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            }
        });
    }; // end of checkCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(ProcessData)
        .then(findOldRecord)
        .then(CreateRecord)
        .then(reportHistory)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.getClusterReport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            console.log('raw_report', req.params)
            if (req.params.cluster_name) {
                if (req.params.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.params.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "getWorkLoad => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.params.cluster_name,
                license_key: req.params.customer_id,
            }, function (err, clusterDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterDetail)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve({clusterData: clusterDetail, customerData: customerDetail});
                }
            })
        });
    }; // end of checkCluster

    let findclustercompliance = (data) => {
        console.log("findclustercompliance");
        return new Promise((resolve, reject) => {
            Reports.find({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'cluster_compliance',
            }, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "getWorkLoad => findclustercompliance()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(ReportData)) {
                    logger.error("Report Not Exists", "getWorkLoad => findclustercompliance()", 5);
                    let apiResponse = response.generate(true, "Report Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    (ReportData).filter((x) => {
                        x = x.toObject();
                    })
                    data['ReportData'] = ReportData;
                    resolve(data);
                }
            })
        });
    }; // end of findclustercompliance

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(findclustercompliance)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.deleteClusterCompliance = (req, res) => {

    let findWorkLoad = () => {
        console.log("findWorkLoad");
        return new Promise((resolve, reject) => {
            Reports.findOneAndDelete({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'cluster_compliance',
            }, {}, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while delete Report", "getWorkLoad => findWorkLoad()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(ReportData);
                }
            })
        });
    }; // end of findWorkLoad

    findWorkLoad()
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

// end cluster compliance Report


//image compliance report

exports.imagecompliancereport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.cluster_name) {
                if (req.body.customer_id) {
                    if (req.body.report_type) {
                        if (req.body.report_type === 'scan_img') {
                            if (req.body.raw_report) {
                                resolve();
                            } else {
                                let apiResponse = response.generate(true, "Required Parameter raw_report is missing", 400, null);
                                reject(apiResponse);
                            }
                        } else {
                            let apiResponse = response.generate(true, "Wrong value for report_type", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter report_type is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "imagecompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "imagecompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "imagecompliancereport => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id,
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "imagecompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "imagecompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let findOldRecord = () => {
        console.log("findoldRecord");
        return new Promise((resolve, reject) => {
            const body = {};
            body['customer_id'] = req.body.customer_id;
            body['cluster_name'] = req.body.cluster_name;
            body['report_type'] = req.body.report_type;
            body['timestamp'] = +new Date();
            body['img'] = (req.body.raw_report).split(',');

            Reports.findOne({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                report_type: req.body.report_type,
            }, function (err, reportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "imagecompliancereport => findoldRecord()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(reportData)) {
                    body['report_id'] = shortid.generate();
                    resolve([body, 'new']);
                } else {
                    resolve([body, 'update']);
                }
            })
        });
    };

    let CreateRecord = (inputs) => {
        console.log("CreateRecord");
        return new Promise((resolve, reject) => {
            if (inputs[1] === 'new') {
                console.log("create new");
                Reports.create(inputs[0], function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while creating record", "imagecompliancereport => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            } else {
                console.log("update");
                Reports.findOneAndUpdate({
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    report_type: req.body.report_type,
                }, inputs[0], {new: true}, function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while updating record", "imagecompliancereport => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            }
        });
    }; // end of checkCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(findOldRecord)
        .then(CreateRecord)
        .then(reportHistory)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.getImageReport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.cluster_name) {
                if (req.params.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.params.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getImageReport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getImageReport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "getImageReport => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.params.cluster_name,
                license_key: req.params.customer_id,
            }, function (err, clusterDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterDetail)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve({clusterData: clusterDetail, customerData: customerDetail});
                }
            })
        });
    }; // end of checkCluster

    let findImagecompliance = (data) => {
        console.log("findImagecompliance");
        return new Promise((resolve, reject) => {
            Reports.find({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'scan_img',
            }, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "getImageReport => findImagecompliance()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(ReportData)) {
                    logger.error("Report Not Exists", "getImageReport => findImagecompliance()", 5);
                    let apiResponse = response.generate(true, "Report Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    (ReportData).filter((x) => {
                        x = x.toObject();
                    })
                    data['ReportData'] = ReportData;
                    resolve(data);
                }
            })
        });
    }; // end of findclustercompliance

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(findImagecompliance)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

// end image compliance report


//app compliance Report

exports.appcompliancereport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.cluster_name) {
                if (req.body.customer_id) {
                    if (req.body.report_type) {
                        if (req.body.report_type === 'app_compliance') {
                            if (req.body.raw_report) {
                                resolve();
                            } else {
                                let apiResponse = response.generate(true, "Required Parameter raw_report is missing", 400, null);
                                reject(apiResponse);
                            }
                        } else {
                            let apiResponse = response.generate(true, "Wrong value for report_type", 400, null);
                            reject(apiResponse);
                        }
                    } else {
                        let apiResponse = response.generate(true, "Required Parameter report_type is missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "clustercompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "clustercompliancereport => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "clustercompliancereport => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.body.cluster_name,
                license_key: req.body.customer_id,
            }, function (err, clusterData) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterData)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(clusterData);
                }
            })
        });
    }; // end of checkCluster

    let findAndUpdateReport = (updateAry) => {
        console.log("ProcessImageData");
        return new Promise((resolve, reject) => {
            Reports.findOneAndUpdate({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                report_type: 'scan_img',
            }, {img: updateAry}, {new: true}, function (err, reportEntry) {
                if (err) {
                    console.log('err', err);
                    logger.error("Internal Server error while updating record", "reportprocessing => CreateRecord()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(reportEntry)
                }
            })
        })
    };

    let sorting = (report, direction) => {
        console.log("ProcessImageData");
        return new Promise((resolve, reject) => {

                const dirVal = direction === 'desc' ?  -1 : 1;

                const sortingArr = {
                    Critical: 1 * dirVal,
                    High: 2 * dirVal,
                    Medium: 3 * dirVal,
                    Low: 4 * dirVal,
                    Negligible: 5 * dirVal,
                    Unknown: 6 * dirVal
                };

                /**
                 * compare_by_severity
                 *
                 * @description Compare Values with Severity
                 *
                 * @param {JSON Object: {"Vulnerability":"*","Severity":"*"}} valueA
                 * @param {JSON Object: {"Vulnerability":"*","Severity":"*"}} valueB
                 * @param { String } direction desc: DESCENDANCE, false: ASCENDANCE
                 * @returns {Number} 0: valueA = valueB, 1: valueA > valueB, 2: valueA < valueB
                 */

                const compare_by_severity = function (valueA, valueB) {
                    const severityValueA = sortingArr[valueA.Severity];
                    const severityValueB = sortingArr[valueB.Severity];
                    return severityValueA === severityValueB? 0: severityValueB - severityValueA;
                }

                let result = '';

                // Parse Report Text to JSON type
                // let json_report = JSON.parse(report);
                let json_report = (report);
                // Check Correct Type
                if (!json_report || !json_report.raw_report || !json_report.raw_report.report_by_image) reject('Error Type in Report');

                for (let key in json_report.raw_report.report_by_image){
                    if(json_report.raw_report.report_by_image.hasOwnProperty(key)){
                        json_report.raw_report.report_by_image[key].sort(compare_by_severity);
                    }
                }

                result =json_report;

                resolve(result);

        })
    };

    let ProcessImageData = () => {
        console.log("ProcessImageData");
        return new Promise((resolve, reject) => {
            const result = {};
            if (!req.body.raw_report || !req.body.raw_report.report_by_image || Object.keys(req.body.raw_report.report_by_image).length < 1) {
                reject({status: 404, msg: 'raw_report is not in a proper form of json'})
            } else {
                // console.log('ary', ary);
                // console.log('ImageName', ImageName);
                let ary = [];
                let ImageName = [];
                sorting(req.body, 'desc')
                    .then((data)=>{
                        (Object.keys(data.raw_report.report_by_image)).filter((x) => {
                            ImageName.push(x);
                            if ((data.raw_report.report_by_image)[x].length > 0) {
                                ((data.raw_report.report_by_image)[x]).filter((y) => {
                                    y['Image'] = x;
                                    ary.push(y);

                                });
                            }
                        });
                        return ImageName;
                    })
                    .then(data => findAndUpdateReport(data))
                    .then(data => resolve({report_by_image: ary}))
                /*findAndUpdateReport(ImageName)
                    .then(sorting(req.body, 'desc'))
                    .then((data) => {
                        resolve({report_by_image: ary})
                    })
                    .catch((err) => {
                        console.log('error from update scanimage report ', err);
                        reject(err);
                    })*/
            }
        });
    }; // ProcessImageData

    let ProcessSeverityData = (finalJson) => {
        console.log("ProcessSeverityData");
        return new Promise((resolve, reject) => {
            const result = {
                Critical: 0, High: 0, Medium: 0, Low: 0, Negligible: 0, Unknown: 0
            }
            let ary = [];

            if (!req.body.raw_report || !req.body.raw_report.report_by_severity || Object.keys(req.body.raw_report.report_by_severity).length < 1) {
                reject({status: 404, msg: 'raw_report is not in a proper form of json'})
            } else {
                (Object.keys(req.body.raw_report.report_by_severity)).forEach(node => {
                    const nodeName = node;

                    if (result[nodeName] !== undefined) {
                        result[nodeName] += (req.body.raw_report.report_by_severity)[node].length;
                        ((req.body.raw_report.report_by_severity)[node]).filter((x) => {
                            x['Severity'] = node;
                            ary.push(x);
                        })
                    } else {
                        result['Unknown'] += (req.body.raw_report.report_by_severity)[node].length;
                        ((req.body.raw_report.report_by_severity)[node]).filter((x) => {
                            x['Severity'] = node;
                            ary.push(x);
                        })
                    }

                });
                finalJson['severity_count'] = result;
                finalJson['report_by_severity'] = ary;
                resolve(finalJson);
            }


        });
    }; // ProcessData

    let findOldRecord = (finalJson) => {
        console.log("findoldRecord");
        return new Promise((resolve, reject) => {
            let body = {};
            body['customer_id'] = req.body.customer_id;
            body['cluster_name'] = req.body.cluster_name;
            body['report_type'] = req.body.report_type;
            body['timestamp'] = +new Date();
            body['summary_json'] = JSON.stringify(finalJson);
            body['raw_report'] = JSON.stringify(req.body.raw_report);

            Reports.findOne({
                customer_id: req.body.customer_id,
                cluster_name: req.body.cluster_name,
                report_type: 'app_compliance',
            }, function (err, reportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "reportprocessing => findoldRecord()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(reportData)) {
                    body['report_id'] = shortid.generate();
                    resolve([body, 'new']);
                } else {
                    resolve([body, 'update']);
                }
            })
        });
    };

    let CreateRecord = (inputs) => {
        console.log("CreateRecord");
        return new Promise((resolve, reject) => {
            if (inputs[1] === 'new') {
                console.log("create new");
                Reports.create(inputs[0], function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while creating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            } else {
                console.log("update");
                Reports.findOneAndUpdate({
                    customer_id: req.body.customer_id,
                    cluster_name: req.body.cluster_name,
                    report_type: 'app_compliance',
                }, inputs[0], {new: true}, function (err, reportEntry) {
                    if (err) {
                        console.log('err', err);
                        logger.error("Internal Server error while updating record", "reportprocessing => CreateRecord()", 5);
                        let apiResponse = response.generate(true, err, 500, null);
                        reject(apiResponse);
                    } else {
                        resolve(reportEntry)
                    }
                })
            }
        });
    }; // end of checkCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(ProcessImageData)
        .then(ProcessSeverityData)
        .then(findOldRecord)
        .then(CreateRecord)
        .then(reportHistory)
        .then((resolve) => {
            resolve = resolve.toObject();
            /* const socket = req.app.io;
             if (socket !== undefined) {
                 socket.to(req.body.customer_id).emit('AppComplianceReport', resolve);
             }
             res.status(200).send(resolve);*/
            Promise.all([emitAppComplianceReport(req, req.body.customer_id, resolve)])
                .then((data) => {
                    res.status(200).send(resolve);
                })
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

exports.getAppReport = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            console.log('raw_report', req.params)
            if (req.params.cluster_name) {
                if (req.params.customer_id) {
                    resolve();
                } else {
                    let apiResponse = response.generate(true, "Required Parameter customer_id is missing", 400, null);
                    reject(apiResponse);
                }
            } else {
                let apiResponse = response.generate(true, "Required Parameter cluster_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({customer_id: req.params.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Not Found", "getWorkLoad => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer Not Found", 401, null);
                    reject(apiResponse);
                } else {
                    if (customerDetail.status && (customerDetail.status).toLowerCase() === 'activate') {
                        resolve(customerDetail);
                    } else {
                        logger.error("Customer is inActive", "getWorkLoad => checkCustomer()", 5);
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
            Cluster.findOne({
                cluster_name: req.params.cluster_name,
                license_key: req.params.customer_id,
            }, function (err, clusterDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching Cluster", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(clusterDetail)) {
                    logger.error("Cluster Not Exists", "clustercompliancereport => checkCluster()", 5);
                    let apiResponse = response.generate(true, "Cluster Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    resolve({clusterData: clusterDetail, customerData: customerDetail});
                }
            })
        });
    }; // end of checkCluster

    let findclustercompliance = (data) => {
        console.log("findclustercompliance");
        return new Promise((resolve, reject) => {
            Reports.find({
                cluster_name: req.params.cluster_name,
                customer_id: req.params.customer_id,
                report_type: 'app_compliance',
            }, function (err, ReportData) {
                if (err) {
                    logger.error("Internal Server error while fetching Report", "getWorkLoad => findclustercompliance()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(ReportData)) {
                    logger.error("Report Not Exists", "getWorkLoad => findclustercompliance()", 5);
                    let apiResponse = response.generate(true, "Report Not Exists", 400, null);
                    reject(apiResponse);
                } else {
                    (ReportData).filter((x) => {
                        x = x.toObject();
                    })
                    data['ReportData'] = ReportData;
                    resolve(data);
                }
            })
        });
    }; // end of findclustercompliance

    validatingInputs()
        .then(checkCustomer)
        .then(checkCluster)
        .then(findclustercompliance)
        .then((resolve) => {
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

//end of app compliance Report
