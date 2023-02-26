
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

//Connects to MongoDB
const dbUrl = "mongodb+srv://ryan24sun:HBAMRS123@cluster0.7ckyjat.mongodb.net/hillsideSuitesDB?retryWrites=true&w=majority";

const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("MongoDB is connected");
    } catch (error) {
        console.log(error);
    }
}

connectDB();

//Reserve Page Default Rooms Database Layout
const roomsDescriptionSchema = {
    type: String,
    doubles: Number,
    queens: Number,
    kings: Number,
    description: String,
    price: Number,
    image: String
};

const Room = mongoose.model("Room", roomsDescriptionSchema);

const room1 = new Room({
    type: "Single Room",
    doubles: 0,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our single rooms at Hillside Suites, with a queen bed, a TV, a couch, and a desk.",
    price: 205, 
    image: "images/singleRoom.jpg"
});

const room2 = new Room({
    type: "Double Room",
    doubles: 2,
    queens: 0,
    kings: 0,
    description: "Enjoy your stay in one of our double rooms at Hillside Suites, with two double beds, a TV, a couch, and a desk.",
    price: 235,
    image: "images/doubleRoom.jpg"
});

const room3 = new Room({
    type: "Triple Room",
    doubles: 2,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our triple rooms at Hillside Suites, with one queen bed, two double beds, a TV, a couch, and a desk.",
    price: 265,
    image: "images/tripleRoom.jpg"
});

const room4 = new Room({
    type: "Master Suite",
    doubles: 0,
    queens: 2,
    kings: 1,
    description: "Enjoy your stay in one of our master suites at Hillside Suites, with one king bed, two queen beds, two TVs, two couches, a desk, and a large bathtub.",
    price: 295,
    image: "images/accomodation3.jpg"
});

const defaultRooms = [room1, room2, room3, room4];

//Website Pages
app.get("/" || "/home", function(req, res){
    res.sendFile(__dirname + "/index.html");

    //Only adds room types to DB once
    Room.find({}, function(error, foundRooms){
        if (foundRooms.length === 0) {
            Room.insertMany(defaultRooms, function(error){
                if (error) {
                    console.log(err);
                } else {
                    console.log("Successfully saved room types to DB.");
                }
            });
        }
    })
});

app.get("/accomodations", function(req, res){
    res.sendFile(__dirname + "/accomodations.html");
});

app.get("/about", function(req, res){
    res.sendFile(__dirname + "/about.html");
});

app.get("/reserve" || "/book" || "/booknow", function(req, res){

    // Uses database info to fill the reserve page
    Room.find({}, function(error, availableRooms) {
        res.render("reserve", {availableRooms: availableRooms});
    });

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

//Form submission to calculate available rooms
app.post("/reserve", function(req, res){

    const arrivalDate = req.body.arrivalDate;
    const departureDate = req.body.departureDate;
    const rooms = req.body.rooms;
    const adults = req.body.adults;
    const children = req.body.children;



})

//Allows app to run locally and on Heroku
app.listen(process.env.PORT || 3000, function() {
console.log("Server is running");
});