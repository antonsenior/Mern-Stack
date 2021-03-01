const express = require('express');
const router = express.Router();
const resourceHistoryController = require("./../../app/controllers/resourceHistoryController");
const appConfig = require("./../../config/appConfig")

const middleware = require('../middlewares/auth');
module.exports.setRouter = (app) => {

    // defining routes.
    app.post('/resource/periodicstats',[resourceHistoryController.createRecord]);
};
