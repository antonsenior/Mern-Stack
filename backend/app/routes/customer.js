const express = require('express');
const router = express.Router();
const customerController = require("./../../app/controllers/customerController");
const appConfig = require("./../../config/appConfig")

const middleware = require('../middlewares/auth');
module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/users`;

    // defining routes.
    app.post('/customer',[customerController.createCustomer]);
    app.post('/update/customer',[customerController.updateCustomer]);
    app.get('/customer',[customerController.getCustomerAll]);
    app.get('/customer/:customer_name',[customerController.getCustomerDetail]);
    app.delete('/customer',[customerController.deleteCustomer]);

}
