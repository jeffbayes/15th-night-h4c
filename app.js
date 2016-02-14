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

			// console.log(resut);

			var rand = parseInt(Math.random() * 10000);
			var requestID = userID + "-" + rand;
			// console.log(requestID);

			var service = req.body.service;
			var gender = req.body.gender;
			var age = req.body.age;
			var push = "<!channel> -- ";
			var fallbackText = push + "Service: ";
			var basicText = service + ". " + gender + ", age " + age + ".";


			var request = {id:rand, text: basicText};
			var requests =JSON.parse(result[0].properties.requests.value);
			requests.push(request);
			
			result[0].properties.requests.value = JSON.stringify(requests);

			console.log(result[0].properties.requests.value);
		
			UserApp.User.save(result[0], function(error, result){
				console.log(error, result);
			})

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
