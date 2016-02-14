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

var handlebars = require('handlebars');
var exphbs = require('express-handlebars');

//Initilization
var app = express();
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');



//routes

app.get('/help/:id', function(req, res) {
	// slack oauth // stretch goal for now
	// Pull the unique stuff out.
	var requestID = req.params.id;
	console.log(requestID);
	var requestArray = requestID.split('-');
	console.log(requestArray[0])
	// REPLACE BEFORE PRODUCTION. IT HAS SEEN THE LIGHT OF DAY.
	UserApp.setToken("x-WrIq6UQC20sI2a-a8bMg");
	UserApp.User.get({"user_id": requestArray[0]}, function(error, result){
		if(error){
			console.log(error);
			console.log("Uh oh, this doesn't work! /help/:id");
		} else {
			var userPhone = result[0]['properties']['phone']['value'];
			res.render('help', {phone: userPhone});
		}

	});
	// Parse into userID and request number.
	// Search userapp for userid
	// find request number
	// fetch info from relevant request
	// fetch info about requester

});


app.post('/postToSlack/:key?', function(req, res) {
	var userID;
	UserApp.setToken(req.params.key);
    UserApp.User.get({}, function(error, result){
		if(error){
			res.redirect('/login')
		} else {
			userID = result[0]['user_id'];

			console.log(result[0]['properties']['phone']['value']);

			var rand = parseInt(Math.random() * 10000);
			var requestID = userID + "-" + rand;
			console.log(requestID);

			var service = req.body.service;
			var gender = req.body.gender;
			var age = req.body.age;
			var push = "<!channel> -- ";
			var fallbackText = push + "Service: ";
			var basicText = service + ". " + gender + ", age " + age + ".";

			var requestURL = "http://localhost:3000/help/" + requestID;
			var extras = "\nFollow the link to accept the request: " + requestURL;

			basicText += extras;

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
		}
    });
});

app.get('/login', function(req, res){
	res.render('login');
})


app.get('/:key?', function(req,res){

	UserApp.setToken(req.params.key);
    UserApp.User.get({}, function(error, result){
		if(!error){
			res.render('index');
		}else{
			res.redirect('/login')
		}
    })	
});


app.get('/invite/:user', function(req, res){
	// require login
	res.render('invite');
})






// start server ie "node app.js"
var server = app.listen(3000, function(){
	var host = server.address().address;
	var port = server.address().port;
	console.log('Example app listening at http://%s:%s', host, port);
});
