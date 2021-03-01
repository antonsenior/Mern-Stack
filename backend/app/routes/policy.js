const express = require('express');
const router = express.Router();
const policycontroller = require("./../../app/controllers/policycontroller");
const appConfig = require("./../../config/appConfig")

const middleware = require('../middlewares/auth');
module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/policy`;

    // defining routes.
    app.post('/policy',[policycontroller.createPolicy]);
    app.get('/policy/:customer_id',[policycontroller.getPolicy]);
    // app.delete('/policy/:policyname/:customer_id',[policycontroller.deletePolicy]);



}
