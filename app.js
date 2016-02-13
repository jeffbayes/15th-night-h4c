'use strict';

//dependencies 
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var MY_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
var slack = require('slack-notify')(MY_SLACK_WEBHOOK_URL);

//Initilization
var app = express();
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies



//routes
app.get('/', function(req,res){
	res.sendFile(path.join(__dirname+'/index.html'));
})

app.post('/postToSlack', function(req,res){
	var message = req.body.message;

	// now we will post a message to slack to let people know a new user signed up!
	var message = {
	  channel: '#shelter',
	  text:  message
	  // username: 'Hal 9000'
	};

	var errorHandler = function(err){
		if (err) {
			console.log('API error:', err);
		} else {
			console.log('Message received!');
			res.redirect('/');
		}
	};

	slack.send(message,errorHandler);

})




// start server ie "node app.js"
var server = app.listen(3000, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
