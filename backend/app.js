var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');

const cors = require('cors');
const session = require('express-session')
const MongoStore = require('connect-mongo')(session);

const fs = require('fs');
const http = require('http');
const appConfig = require('./config/appConfig');
const logger = require('./app/libs/loggerLib');
const routeLoggerMiddleware = require('./app/middlewares/routeLogger.js');
const globalErrorMiddleware = require('./app/middlewares/appErrorHandler');

// const passport = require('./app/middlewares/passport');

const morgan = require('morgan');
var mongoose = require('mongoose')


var app = express();

app.use(morgan('dev'));

app.use('./upload', express.static('upload'));
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '100mb'}));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(routeLoggerMiddleware.logIp);
app.use(globalErrorMiddleware.globalErrorHandler);


const modelsPath = './app/models';
const routesPath = './app/routes';

app.use(cors({origin: true, credentials: true}));

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    next();
});

fs.readdirSync(modelsPath).forEach(function (file) {
    if (~file.indexOf('.js')) require(modelsPath + '/' + file)
});

fs.readdirSync(routesPath).forEach(function (file) {
    if (~file.indexOf('.js')) {
        let route = require(routesPath + '/' + file);
        route.setRouter(app);
    }
});

app.use(globalErrorMiddleware.globalNotFoundHandler);

const server = http.createServer(app);
server.listen(appConfig.port);
server.on('error', onError);
server.on('listening', onListening);

function onError(error) {
    if (error.syscall !== 'listen') {
        logger.error(error.code + ' not equal listen', 'serverOnErrorHandler', 10)
        throw error;
    }


    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            logger.error(error.code + ':elavated privileges required', 'serverOnErrorHandler', 10);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            logger.error(error.code + ':port is already in use.', 'serverOnErrorHandler', 10);
            process.exit(1);
            break;
        default:
            logger.error(error.code + ':some unknown error occured', 'serverOnErrorHandler', 10);
            throw error;
    }
}

function onListening() {

    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    ('Listening on ' + bind);
    // logger.info('server listening on port' + addr.port, 'serverOnListeningHandler', 10);
    let db = mongoose.connect(appConfig.db.uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true
    });
    console.log('server listening on port ' + addr.port)
}

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});


mongoose.connection.on('error', function (err) {
    console.log('database connection error');
    console.log(err)
    logger.error(err,
        'mongoose connection on error handler', 10)
    //process.exit(1)
}); // end mongoose connection error

mongoose.connection.on('open', function (err) {
    if (err) {
        console.log("database error");
        console.log(err);
        logger.error(err, 'mongoose connection open handler', 10)
    } else {
        console.log("database connection open success");
        // logger.info("database connection open",
        //     'database connection open handler', 10)
    }
    //process.exit(1)
}); // enr mongoose connection o


let newserver = require('http').createServer(app);
newserver.listen(3000, () => {
    console.log(`socket listening on port 3000`);
});
let io = require('socket.io').listen(newserver);
global.io = io;


io.on('connection', function (socket) {
    console.log('client connected');
    app.io = io;
    app.socket = socket;

    socket.on('pong', function(data){
        console.log("Pong received from client");
    });
    setTimeout(sendHeartbeat, 10000);

    function sendHeartbeat(){
        setTimeout(sendHeartbeat, 10000);
        io.sockets.emit('ping', { beat : 1 });
    }
});

module.exports = app;



