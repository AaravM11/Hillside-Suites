
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

const RoomType = mongoose.model("RoomType", roomsDescriptionSchema);

const singleRoom = new RoomType({
    type: "Single Room",
    doubles: 0,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our single rooms at Hillside Suites, with a queen bed, a TV, a couch, and a desk.",
    price: 205, 
    image: "images/singleRoom.jpg"
});

const doubleRoom = new RoomType({
    type: "Double Room",
    doubles: 2,
    queens: 0,
    kings: 0,
    description: "Enjoy your stay in one of our double rooms at Hillside Suites, with two double beds, a TV, a couch, and a desk.",
    price: 235,
    image: "images/doubleRoom.jpg"
});

const tripleRoom = new RoomType({
    type: "Triple Room",
    doubles: 2,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our triple rooms at Hillside Suites, with one queen bed, two double beds, a TV, a couch, and a desk.",
    price: 265,
    image: "images/tripleRoom.jpg"
});

const masterSuite = new RoomType({
    type: "Master Suite",
    doubles: 0,
    queens: 2,
    kings: 1,
    description: "Enjoy your stay in one of our master suites at Hillside Suites, with one king bed, two queen beds, two TVs, two couches, a desk, and a large bathtub.",
    price: 295,
    image: "images/accomodation3.jpg"
});

const defaultRooms = [singleRoom, doubleRoom, tripleRoom, masterSuite];

//Available rooms layout in database
const roomsSchema = {
    type: String,
    roomNumber: Number,
    booked: Boolean,
    dates: [{
        startDate: String,
        endDate: String
    }]
}

const Room = mongoose.model("Room", roomsSchema);

var date = new Date().toISOString();

const allRooms = [];

for (let i = 0; i < 10; i++) {
    const singleRoom = new Room({
        type: "Single Room",
        roomNumber: i + 1,
        booked: false,
        dates: [{
            startDate: date,
            endDate: date
        }]
    });
    allRooms.push(singleRoom);
}

for (let i = 10; i < 20; i++) {
    const doubleRoom = new Room({
        type: "Double Room",
        roomNumber: i + 1,
        booked: false,
        dates: [{
            startDate: date,
            endDate: date
        }]
    });
    allRooms.push(doubleRoom);
}

for (let i = 20; i < 30; i++) {
    const tripleRoom = new Room({
        type: "Triple Room",
        roomNumber: i + 1,
        booked: false,
        dates: [{
            startDate: date,
            endDate: date
        }]
    });
    allRooms.push(tripleRoom);
}

for (let i = 30; i < 35; i++) {
    const masterSuite = new Room({
        type: "Master Suite",
        roomNumber: i + 1,
        booked: false,
        dates: [{
            startDate: date,
            endDate: date
        }]
    });
    allRooms.push(masterSuite);
}

//Website Pages
app.get("/" || "/home", function(req, res){
    res.sendFile(__dirname + "/index.html");

    //Only adds room types to DB once
    RoomType.find({}, function(error, foundRooms){
        if (foundRooms.length === 0) {
            RoomType.insertMany(defaultRooms, function(error){
                if (error) {
                    console.log(err);
                } else {
                    console.log("Successfully saved room types to DB.");
                }
            });
        }
    });

    //Only adds all rooms to DB once
    Room.find({}, function(error, foundRooms){
        if (foundRooms.length === 0) {
            Room.insertMany(allRooms, function(error){
                if (error) {
                    console.log(err);
                } else {
                    console.log("Successfully saved all rooms to DB.");
                }
            });
        }
    });
});

app.get("/accomodations", function(req, res){
    res.sendFile(__dirname + "/accomodations.html");
});

app.get("/about", function(req, res){
    res.sendFile(__dirname + "/about.html");
});

app.get("/checkout", function(req, res){
    res.sendFile(__dirname + "/checkout.html");
});

var bookingError = 0;

app.get("/reserve" || "/book" || "/booknow", function(req, res){

    // Uses database info to fill the reserve page
    RoomType.find({}, function(error, availableRooms) {
        res.render("reserve", {bookingError, availableRooms: availableRooms});
    });

    const date = new Date();
    Room.updateMany({ booked: false }, { dates: [{ startDate: date, endDate: date }] }, function(error) {
        if (error) {
            console.log(error);
        }
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

const roomsFilled = [];

function alreadyChecked(roomNumber) {
    for (let m = 0; m < roomsFilled.length; m++) {
        if (roomsFilled[m] == roomNumber) {
            return true;
        }
    }
    return false;
}

//Function to book rooms
function checkRooms(arrivalDate, departureDate, roomType) {

    Room.find({ type: roomType }, function(error, rooms) {
        if (error) {
            console.log(error);
        } else {

            //Checks each room until it finds one that is vacant
            for (let i = 0; i < rooms.length; i++) {
                if (rooms[i].booked === false) {
                    if (!(alreadyChecked(rooms[i].roomNumber))) {
                        console.log("found open slot");
                        console.log(i);
                        roomsFilled.push(rooms[i].roomNumber);
                        break;
                    }
                }    
                //Checks if a start and end date is compatible with a booked room
                else {
                    var breakLoop = 0;
                    for (let j = 0; j < rooms[i].dates.length; j++) {

                        const roomStartDate = new Date(rooms[i].dates[j].startDate);
                        const roomEndDate = new Date(rooms[i].dates[j].endDate);
                        const userStartDate = new Date(arrivalDate);
                        const userEndDate = new Date(departureDate);

                        if (roomStartDate.getTime() > userEndDate.getTime()) {

                            var found = 1;

                            for (let l = 0; l < rooms[i].dates.length; l++) {
                                if (l != j) {
                                    if (rooms[i].dates[l].endDate.getTime() > roomStartDate.getTime()) {
                                        found = 0;
                                    } else if (rooms[i].dates[l].startDate.getTime() < roomEndDate.getTime()) {
                                        found = 0;
                                    }
                                }
                            }

                            if (found = 1 && !(alreadyChecked(rooms[i].roomNumber))) {
                                console.log("found slot before");
                                console.log(i);                             
                                breakLoop = 1;
                                roomsFilled.push(rooms[i].roomNumber);
                                break;
                            }

                        } else if (roomEndDate.getTime() < userStartDate.getTime()) {

                            var found = 1;

                            for (let l = 0; l < rooms[i].dates.length; l++) {
                                if (l != j) {
                                    if (rooms[i].dates[l].endDate.getTime() > roomStartDate.getTime()) {
                                        found = 0;
                                    } else if (rooms[i].dates[l].startDate.getTime() < roomEndDate.getTime()) {
                                        found = 0;
                                    }
                                }
                            }

                            if (found = 1 && !(alreadyChecked(rooms[i].roomNumber))) {
                                console.log("found slot after");
                                console.log(i);                            
                                breakLoop = 1;
                                roomsFilled.push(rooms[i].roomNumber);
                                break;
                            }
                        }    
                    }

                    if (breakLoop === 1) {
                        break;
                    }
                }                            
            }
        }
    });

}

//Form submission to calculate available rooms
app.post("/reserve", function(req, res){

    const arrivalDate = req.body.arrivalDate;
    const departureDate = req.body.departureDate;
    const rooms = req.body.rooms;
    const adults = req.body.adults;
    const children = req.body.children;
    const totalPeople = parseInt(adults) + parseInt(children);
    
    // const start = new Date("2023-03-03T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));
    // const end = new Date("2023-03-07T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));

    // Room.updateOne({ roomNumber: 1 }, { booked: true, dates: [{ startDate: start, endDate: end }] }, function(error) {
    // });

    // Room.deleteMany({}, function(error) {
    // });

    if (totalPeople > 6) {
        bookingError = 1;
        res.redirect("/reserve");
    } else {
        bookingError = 0;

        if (totalPeople <= 2) {
            for (let k = 0; k < rooms; k++) {
                checkRooms(arrivalDate, departureDate, "Single Room");
            }
        } else if (totalPeople <= 4) {
            for (let k = 0; k < rooms; k++) {
                checkRooms(arrivalDate, departureDate, "Double Room");
            }
        } else {
            for (let k = 0; k < rooms; k++) {
                checkRooms(arrivalDate, departureDate, "Triple Room");
            }
            for (let k = 0; k < rooms; k++) {
                checkRooms(arrivalDate, departureDate, "Master Suite");
            }
        }

        setTimeout(() => {
            //Sends an error if not all rooms were filled
            if (roomsFilled.length < rooms) {
                bookingError = 2;
                console.log("Not all rooms filled");
                console.log(roomsFilled);
            } else {
                console.log("Rooms successfully filled!");
                console.log(roomsFilled);
            }      
        }, 1000);               
    }    
});

//Allows app to run locally and on Heroku
app.listen(process.env.PORT || 3000, function() {
console.log("Server is running");
});