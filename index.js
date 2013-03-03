var framework = require('partial.js');
var http = require('http');

var port = parseInt(process.argv[2] || '8000');
var debug = true;

framework.init(http, debug, port);
console.log('http://127.0.0.1:{0}/'.format(port));