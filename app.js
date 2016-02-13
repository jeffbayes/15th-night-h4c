'use strict';

//dependencies 
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');


var MY_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
var slack = require('slack-notify')(MY_SLACK_WEBHOOK_URL);

var UserApp = require('userapp');
UserApp.initialize({
	appId: "56bf8c06a0f39"
});

//Initilization
var app = express();
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies



//routes

app.get('/help/:id', function(req, res) {
	// slack oauth // stretch goal for now
	// Pull the unique stuff out.
	var id = req.params.id;
	res.sendFile(path.join(__dirname+'/help.html'));
	// Parse into userID and request number.
	// Search userapp for userid
	// find request number
	// fetch info from relevant request
	// 

});


app.post('/postToSlack', function(req, res) {
	var requestHash = "u98n30i69qu687e-PANDA";
	var hashArray = requestHash.split("-");
	var service = req.body.service;
	var gender = req.body.gender;
	var age = req.body.age;
	var push = "<!channel> -- ";
	var fallbackText = push + "Service: ";
	var basicText = service + ". " + gender + ", age " + age + ".";

	var requestURL = "http://localhost:3000/help/userID-requestID";
	var extras = "\nFollow the link to accept the request: " + requestURL;

	basicText += extras;

	// now we will post a message to slack to let people know a new user signed up!
	var message = {
	  channel: '#shelter',
	  icon_emoji: ':house:',
	  username: "HELP REQUEST",
	  title: "HELP REQUEST",
	  text: fallbackText + basicText
	  // username: 'Hal 9000'
	};

	var fancyMessage = {
	  	channel: '#shelter',
	  	icon_emoji: ':house:',
	  	username: "HELP REQUEST",
		attachments: [{
			fallback: fallbackText + basicText,
			title: "<!channel>: New request for " + service + ".",
			title_link: requestURL,
			text: basicText,
			color: "#7CD197"
		}]
	}


	var errorHandler = function(err){
		if (err) {
			console.log('API error:', err);
		} else {
			console.log('Message received!');
			res.redirect('/');
		}
	};

	slack.send(fancyMessage, errorHandler);

});

app.get('/login', function(req, res){
	res.sendFile(path.join(__dirname+'/login.html'));
})


app.get('/:key?', function(req,res){

	UserApp.setToken(req.params.key);
    UserApp.User.get({}, function(error, result){
		if(!error){
			res.sendFile(path.join(__dirname+'/index.html'));
		}else{
			res.redirect('/login')
		}
    })	
});


app.get('/invite/:user', function(req, res){
	// require login
	res.sendFile(path.join(__dirname+'/invite.html'));
})






// start server ie "node app.js"
var server = app.listen(3000, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
