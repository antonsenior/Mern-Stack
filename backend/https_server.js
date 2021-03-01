var https = require('https');

var fs = require('fs');

var options = {

  key: fs.readFileSync("./config/cnox.io.key"),

  cert: fs.readFileSync("./config/www_cnox_io.crt"),

  ca: [

          fs.readFileSync('./config/AddTrustExternalCARoot.crt'),

          fs.readFileSync('./config/SectigoRSADomainValidationSecureServerCA.crt')

       ]
};
 

https.createServer(options, function (req, res) {

 res.writeHead(200);

 res.end("Welcome to Node.js HTTPS Servern");

}).listen(8443)
