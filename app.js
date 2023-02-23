
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//Website Pages
app.get("/" || "/home", function(req, res){
    res.sendFile(__dirname + "/index.html");
});

app.get("/accomodations", function(req, res){
    res.sendFile(__dirname + "/accomodations.html");
});

app.get("/about", function(req, res){
    res.sendFile(__dirname + "/about.html");
});

app.get("/reserve" || "/book" || "/booknow", function(req, res){
    res.sendFile(__dirname + "/reserve.html");
});

//Mailchimp API
app.post("/", function(req, res){

    const email = req.body.email;

    const data = {
        members: [
            {
                email_address: email,
                status: "subscribed"
            }
        ]
    };

    const jsonData = JSON.stringify(data);

    const url = "https://us21.api.mailchimp.com/3.0/lists/7473dea804";

    const options = {
        method: "POST",
        auth: "HillsideSuites:05d75f6f5dfc49c208dd6a0f4a302ef6-us21"
    }

    const request = https.request(url, options, function(response) {
        response.on("data", function(data) {
            console.log(JSON.parse(data));
        })
    })

    request.write(jsonData);
    request.end();

});

app.post("/reserve", function(req, res){

    const arrivalDate = req.body.arrivalDate;
    const departureDate = req.body.departureDate;

    const rooms = req.body.rooms;
    // const adults = req.body.adults.value;
    // const children = req.body.children.value;
    console.log(arrivalDate + departureDate);
    console.log(rooms);

})

//Allows testing for app on Heroku and local system
app.listen(process.env.PORT || 3000, function() {
    console.log("Server is running");
});