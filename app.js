'use strict';

//dependencies 
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var MY_SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
var slack = require('slack-notify')(MY_SLACK_WEBHOOK_URL);
// THIS IS BAD NAMESPACING. FIX IT LATER.
var Slack = require('slack-node');
// REMOVE BEFORE PRODUCTION. IT HAS SEEN THE LIGHT OF DAY.
var apiToken = "xoxp-21255113202-21255543414-21308331154-232305f633";
var SlackAPI = new Slack(apiToken);

var UserApp = require('userapp');
UserApp.initialize({
	appId: "56bf8c06a0f39"
});

var handlebars = require('handlebars');
var exphbs = require('express-handlebars');

//Initilization
var app = express();
app.use(bodyParser.urlencoded({extended: true})); // to support URL-encoded bodies
app.engine('.hbs', exphbs({extname: '.hbs', defaultLayout: 'main'}));
app.set('view engine', '.hbs');

//routes
app.use(express.static(path.join(__dirname, 'public')));

app.get('/help/:id', function(req, res) {
	// slack oauth // stretch goal for now
	// Pull the unique stuff out.
	var requestID = req.params.id;
	console.log(requestID);
	var requestArray = requestID.split('-');
	console.log(requestArray[0]);
	console.log(requestArray[1]);
	// REPLACE BEFORE PRODUCTION. IT HAS SEEN THE LIGHT OF DAY.
	UserApp.setToken("x-WrIq6UQC20sI2a-a8bMg");
	UserApp.User.get({"user_id": requestArray[0]}, function(error, result){
		if(!error){
			console.log(result[0])
			var userEmail = result[0]['email']
			var userPhone = result[0]['properties']['phone']['value'];
			var userRequests = JSON.parse(result[0]['properties']['requests']['value']);
			console.log(userRequests)
			var theRequest = userRequests.map(function(item){
				if (item['id'] == requestArray[1]){
					res.render('help', {phone: userPhone, email: userEmail, info: item['text']});
				} else { return item; }
			})
		} else {
			console.log(error);
			console.log("Uh oh, this doesn't work! /help/:id");
		}

	});
});

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}

app.post('/help/close/:id', function(req, res) {
	var userEmail, userPhone, requestText;
	var requestID = req.params.id;
	var requestArray = requestID.split('-');

	// REPLACE BEFORE PRODUCTION. IT HAS SEEN THE LIGHT OF DAY.
	UserApp.setToken("x-WrIq6UQC20sI2a-a8bMg");

	UserApp.User.get({"user_id": requestArray[0]}, function(error, result){
		if(!error) {
			console.log(result[0])
			userEmail = result[0]['email']
			userPhone = result[0]['properties']['phone']['value'];
			var userRequests = JSON.parse(result[0]['properties']['requests']['value']);

			var removeRequests = userRequests.map(function(item){
				if (item['id'] == requestArray[1]){
					requestText = item['text'];	
				} else { return item; }
			});
			var updatedRequests = cleanArray(removeRequests);
			result[0].properties.requests.value = JSON.stringify(updatedRequests);
			UserApp.User.save(result[0], function(error, result){

				// BRING BACK TIMEOUT FOR PRODUCTION. A QUICK RESPONSE DOESN'T WORK FOR SLACK.
				// MAYBE REMOVE FOR DEMO.
				setTimeout(function() {
					SlackAPI.api('search.messages', { 
						query: requestID
					}, function(err, resp){
						console.log(resp);
						var match = resp['messages']['matches'][0];
						console.log(match);
						SlackAPI.api('chat.delete', {
							ts: match['ts'],
							channel: match['channel']['id']
						}, function(err, response){
							console.log(response);
							var messageText = "Recent request #" + requestArray[1] + " has been fulfilled. Thank you!";
							var fancyMessage = {
				  				channel: '#shelter',
							  	icon_emoji: ':house:',
							  	username: "Request Accepted!",
								attachments: [{
									fallback: messageText,
									title: "Request Accepted!",
									text: messageText,
									color: "#7CD197"
								}]
							}

							var errorHandler = function(err){
								if (err) {
									console.log('API error:', err);
								} else {
									console.log('Message received!');
								}
							};
							slack.send(fancyMessage, errorHandler);
						})
						console.log(match);
					});
				}, 14000);
				res.redirect("/confirm/" + encodeURIComponent(userEmail) + "/" + encodeURIComponent(userPhone)
					+ "/" + encodeURIComponent(requestText));
			});
		} else {
			console.log(error);
			console.log("Uh oh, this doesn't work! /help/close/:id");
		}
	});
})

app.get("/confirm/:mail/:phone/:info", function(req, res) {
	var encodedEmail = req.params.mail;
	var encodedPhone = req.params.phone;
	var encodedInfo = req.params.info;
	var email = decodeURIComponent(encodedEmail);
	var phone = decodeURIComponent(encodedPhone);
	var info = decodeURIComponent(encodedInfo);
	res.render('helpConfirm', {email: email, phone: phone, info: info})
	console.log("=====================================");
	console.log("=====================================");
	// res.redirect("/");
})


app.post('/postToSlack/:key?', function(req, res) {
	var userID;
	UserApp.setToken(req.params.key);
    UserApp.User.get({}, function(error, result){
		if(error){
			res.redirect('/login')
		} else {
			userID = result[0]['user_id'];

			var rand = parseInt(Math.random() * 10000);
			var requestID = userID + "-" + rand;

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
					color: "#38B0DE"
				}]
			}

			var errorHandler = function(err){
				if (err) {
					console.log('API error:', err);
				} else {
					console.log('Message received!');
					res.redirect('/request/'+req.params.key+"/"+" message recieved");
				}
			};
			slack.send(fancyMessage, errorHandler);
		}
    });
});

app.get('/login', function(req, res){
	res.render('login');
})


app.get('/request/:key?/:message?', function(req,res){

	UserApp.setToken(req.params.key);
    UserApp.User.get({}, function(error, result){
		if(!error){
			res.render('request', {message: req.params.message});
		}else{
			res.redirect('/login')
		}
    })	
});

app.get('/', function(req,res){
	res.render('index');
})


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
