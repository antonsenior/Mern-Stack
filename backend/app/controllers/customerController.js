const shortid = require('shortid');
const mongoose = require('mongoose');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const check = require('../libs/checkLib')

const Customer = mongoose.model('Customer');

let createCustomer = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.name) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.find({name:req.body.name},function (err,customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "createCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    resolve();
                } else {
                    logger.error("Customer Already Exists", "createCustomer => checkTeamMember()", 5);
                    let apiResponse = response.generate(true, "Customer Already Exists", 401, null);
                    reject(apiResponse);
                }
            })
        });
    }; // end of checkCustomer

    let addCustomer = () => {
        console.log("addCustomer");
        return new Promise((resolve, reject) => {
            let body = {
                customer_id: shortid.generate(),
                name: req.body.name,
                status: 'Activate',
            };
            Customer.create(body,function (err,customer) {
                if (err) {
                    logger.error("Internal Server error while create customer", "createCustomer => addCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(customer);
                }
            })
        });
    }; // end of addCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(addCustomer)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let updateCustomer = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.customer_id) {
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
            Customer.findOne({customer_id: req.body.customer_id}, function (err, customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "updateCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer is not Exists", "updateCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, "Customer is not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCustomer

    let addCustomer = (customerDetail) => {
        console.log("addCustomer");
        return new Promise((resolve, reject) => {
            let updateBody = {
                name: req.body.name ? req.body.name : customerDetail.name,
                status: req.body.status ? req.body.status : customerDetail.status,
            };
            Customer.findOneAndUpdate({customer_id: req.body.customer_id}, updateBody, {new: true}, function (err, customer) {
                if (err) {
                    logger.error("Internal Server error while create customer", "updateCustomer => addCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(customer);
                }
            })
        });
    }; // end of addCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(addCustomer)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let getCustomerDetail = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.params.customer_name) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter customer_name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.findOne({name:req.params.customer_name},function (err,customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "createCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer Does not Exists", "createCustomer => checkTeamMember()", 5);
                    let apiResponse = response.generate(true, "Customer Does not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve(customerDetail);
                }
            })
        });
    }; // end of checkCustomer

    validatingInputs()
        .then(checkCustomer)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let getCustomerAll = (req, res) => {

    let listCustomer = () => {
        console.log("listCustomer");
        return new Promise((resolve, reject) => {
            Customer.find({},function (err,customer) {
                if (err) {
                    logger.error("Internal Server error while create customer", "createCustomer => listCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(customer);
                }
            })
        });
    }; // end of listCustomer

    listCustomer()
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
};

let deleteCustomer = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.name) {
                resolve();
            } else {
                let apiResponse = response.generate(true, "Required Parameter name is missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let checkCustomer = () => {
        console.log("checkCustomer");
        return new Promise((resolve, reject) => {
            Customer.find({name:req.body.name},function (err,customerDetail) {
                if (err) {
                    logger.error("Internal Server error while fetching customer", "createCustomer => checkCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(customerDetail)) {
                    logger.error("Customer does not Exists", "budgetController => checkTeamMember()", 5);
                    let apiResponse = response.generate(true, "Customer does not Exists", 401, null);
                    reject(apiResponse);
                } else {
                    resolve();
                }
            })
        });
    }; // end of checkCustomer

    let removeCustomer = () => {
        console.log("removeCustomer");
        return new Promise((resolve, reject) => {
            Customer.deleteOne({name: req.body.name},function (err,customer) {
                if (err) {
                    logger.error("Internal Server error while delete customer", "createCustomer => removeCustomer()", 5);
                    let apiResponse = response.generate(true, err, 500, null);
                    reject(apiResponse);
                } else {
                    resolve(customer);
                }
            })
        });
    }; // end of removeCustomer

    validatingInputs()
        .then(checkCustomer)
        .then(removeCustomer)
        .then((resolve) => {
            // let apiResponse = response.generate(false, "Customer Created Successfully!!", 200, resolve);
            res.status(200).send(resolve);
        })
        .catch((err) => {
            console.log(err);
            res.status(err.status).send(err);
        });
}


module.exports = {
    createCustomer: createCustomer,
    updateCustomer: updateCustomer,
    getCustomerAll: getCustomerAll,
    getCustomerDetail: getCustomerDetail,
    deleteCustomer: deleteCustomer,
}
