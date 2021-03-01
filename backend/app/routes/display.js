const express = require('express');
const router = express.Router();
const Displaycontroller = require("../controllers/displayController");
const appConfig = require("./../../config/appConfig")

const middleware = require('../middlewares/auth');
module.exports.setRouter = (app) => {

    // app.post('/Display/',[Displaycontroller.]);
    app.post('/display/',[Displaycontroller.createDisplay]);
    app.get('/display/',[Displaycontroller.getDisplay]);

};
