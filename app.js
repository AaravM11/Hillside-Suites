
const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");
const https = require("https");
const mongoose = require("mongoose");
// const cors = require("cors");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cors());

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
    image: String,
    rooms: Number
};

const RoomType = mongoose.model("RoomType", roomsDescriptionSchema);
var rooms = 0;

const singleRoom = new RoomType({
    type: "Single Room",
    doubles: 0,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our single rooms at Hillside Suites, with a queen bed, a TV, a couch, and a desk.",
    price: 205, 
    image: "images/singleRoom.jpg",
    rooms: rooms
});

const doubleRoom = new RoomType({
    type: "Double Room",
    doubles: 2,
    queens: 0,
    kings: 0,
    description: "Enjoy your stay in one of our double rooms at Hillside Suites, with two double beds, a TV, a couch, and a desk.",
    price: 235,
    image: "images/doubleRoom.jpg",
    rooms: rooms
});

const tripleRoom = new RoomType({
    type: "Triple Room",
    doubles: 2,
    queens: 1,
    kings: 0,
    description: "Enjoy your stay in one of our triple rooms at Hillside Suites, with one queen bed, two double beds, a TV, a couch, and a desk.",
    price: 265,
    image: "images/tripleRoom.jpg",
    rooms: rooms
});

const masterSuite = new RoomType({
    type: "Master Suite",
    doubles: 0,
    queens: 2,
    kings: 1,
    description: "Enjoy your stay in one of our master suites at Hillside Suites, with one king bed, two queen beds, two TVs, two couches, a desk, and a large bathtub.",
    price: 295,
    image: "images/accomodation3.jpg",
    rooms: rooms
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

var bookingError = 0;
// app.locals.checkoutRooms = [];
var checkoutRooms = [];

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

app.get("/amenities", function(req, res){
    res.sendFile(__dirname + "/amenities.html");
});

app.get("/checkout", function(req, res){
    var rooms = checkoutRooms.length;
    res.render("checkout.ejs", {rooms});
});

app.get("/test", function(req, res){
    res.render("test.ejs", {checkoutRooms})
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

var roomsFilled = [];
var arrivalDate;
var departureDate;
var adults;
var children;

function alreadyChecked(roomNumber) {
    for (let m = 0; m < roomsFilled.length; m++) {
        if (roomsFilled[m] == roomNumber) {
            return true;
        }
    }
    return false;
}

function addToCheckoutRooms(i, rooms) {

    var price;
    if (rooms[i].type === "Single Room") {
        price = 0;
    } else if (rooms[i].type === "Double Room") {
        price = 1;
    } else if (rooms[i].type === "Triple Room") {
        price = 2;
    } else {
        price = 3;
    }

    const specificRoom = {
        type: rooms[i].type,
        roomNumber: rooms[i].roomNumber,
        startDate: arrivalDate,
        endDate: departureDate,
        adults: adults,
        children: children,
        price: defaultRooms[price].price
    }

    checkoutRooms.push(specificRoom);
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
                        addToCheckoutRooms(i, rooms);
                        break;
                    }
                }    
                //Checks if a start and end date is compatible with a booked room
                else {

                    var foundBooking = 1;

                    for (let j = 0; j < rooms[i].dates.length; j++) {

                        const testRoomStartDate = new Date(rooms[i].dates[j].startDate);
                        var test2RoomStartDate = new Date(Date.UTC(testRoomStartDate.getUTCFullYear(), testRoomStartDate.getUTCMonth(), testRoomStartDate.getUTCDate()));
                        roomStartDate = test2RoomStartDate.getTime();
                        
                        const testRoomEndDate = new Date(rooms[i].dates[j].endDate);
                        var test2RoomEndDate = new Date(Date.UTC(testRoomEndDate.getUTCFullYear(), testRoomEndDate.getUTCMonth(), testRoomEndDate.getUTCDate()));
                        roomEndDate = test2RoomEndDate.getTime();
                        
                        const testUserStartDate = new Date(arrivalDate);
                        var user2StartDate = new Date(Date.UTC(testUserStartDate.getUTCFullYear(), testUserStartDate.getUTCMonth(), testUserStartDate.getUTCDate()));
                        userStartDate = user2StartDate.getTime();
                        
                        const testUserEndDate = new Date(departureDate);
                        var user2EndDate = new Date(Date.UTC(testUserEndDate.getUTCFullYear(), testUserEndDate.getUTCMonth(), testUserEndDate.getUTCDate()));
                        userEndDate = user2EndDate.getTime();

                        console.log("roomStartDate:");
                        console.log(test2RoomStartDate);
                        console.log("roomEndDate:");
                        console.log(test2RoomEndDate);
                        console.log(j);
                        console.log("userStartDate:");
                        console.log(user2StartDate);
                        console.log("userEndDate:");
                        console.log(user2EndDate);

                        if (roomStartDate >= userEndDate) {
                            console.log("room start date is greater or equal to user end date (found before)");
                            console.log("j:" + j);
                            console.log(roomStartDate >= userEndDate);
                            console.log(roomStartDate);
                            console.log(userEndDate);

                        } else if (roomEndDate <= userStartDate) {
                            console.log("room end date is less than or equal to user start date (found after)");                     
                        
                        } else {
                            foundBooking = 0;
                            break;
                        }

                    }
                    
                    if (foundBooking === 1 && !(alreadyChecked(rooms[i].roomNumber))) {
                        console.log("found open slot");
                        console.log(i); 
                        roomsFilled.push(rooms[i].roomNumber); 
                        addToCheckoutRooms(i, rooms);                      
                        break;
                    }     
                }
            }
        }
    });
}

//Form submission to calculate available rooms
app.post("/reserve", function(req, res){

    roomsFilled = [];

    arrivalDate = req.body.arrivalDate;
    departureDate = req.body.departureDate;
    rooms = req.body.rooms;
    adults = req.body.adults;
    children = req.body.children;
    const totalPeople = parseInt(adults) + parseInt(children);
    
    // const start = new Date("2023-03-03T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));
    // const end = new Date("2023-03-07T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));

    // Room.updateOne({ roomNumber: 1 }, { booked: true, dates: [{ startDate: start, endDate: end }] }, function(error) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log("success mothafu");
    //     }
    // });

    // const start = new Date("2023-03-10T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));
    // const end = new Date("2023-03-13T00:00:00".replace(/-/g, '\/').replace(/T.+/, ''));

    // Room.updateOne({ roomNumber: 1 }, { booked: true, $push: {dates: [{ startDate: start, endDate: end }]}  }, function(error) {
    // });

    // Room.updateMany({}, {booked: true}, function(error) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log("success");
    //     }
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
                RoomType.deleteMany({}, function(error) {
                    if (error) {
                        console.log(error);
                    }
                });
                const newRooms = [];
                var single = 0;
                var double = 0;
                var triple = 0;
                var master = 0;

                const newSingle = new RoomType({
                    type: "Single Room",
                    doubles: 0,
                    queens: 1,
                    kings: 0,
                    description: "Enjoy your stay in one of our single rooms at Hillside Suites, with a queen bed, a TV, a couch, and a desk.",
                    price: 205, 
                    image: "images/singleRoom.jpg",
                    rooms: rooms
                });

                const newDouble = new RoomType({
                    type: "Double Room",
                    doubles: 2,
                    queens: 0,
                    kings: 0,
                    description: "Enjoy your stay in one of our double rooms at Hillside Suites, with two double beds, a TV, a couch, and a desk.",
                    price: 235,
                    image: "images/doubleRoom.jpg",
                    rooms: rooms
                });

                const newTriple = new RoomType({
                    type: "Triple Room",
                    doubles: 2,
                    queens: 1,
                    kings: 0,
                    description: "Enjoy your stay in one of our triple rooms at Hillside Suites, with one queen bed, two double beds, a TV, a couch, and a desk.",
                    price: 265,
                    image: "images/tripleRoom.jpg",
                    rooms: rooms
                });

                const newMaster = new RoomType({
                    type: "Master Suite",
                    doubles: 0,
                    queens: 2,
                    kings: 1,
                    description: "Enjoy your stay in one of our master suites at Hillside Suites, with one king bed, two queen beds, two TVs, two couches, a desk, and a large bathtub.",
                    price: 295,
                    image: "images/accomodation3.jpg",
                    rooms: rooms
                });

                for (let i = 0; i < roomsFilled.length; i++) {
                    if (1 <= roomsFilled[i] && roomsFilled[i] <= 10 && single === 0) {
                        newRooms.push(newSingle);
                        single = 1;
                    }
                    else if (11 <= roomsFilled[i] && roomsFilled[i] <= 20 && double === 0) {
                        newRooms.push(newDouble);
                        double = 1;
                    } else if (21 <= roomsFilled[i] && roomsFilled[i] <= 30 && triple === 0) {
                        newRooms.push(newTriple);
                        triple = 1;
                    } else if (31 <= roomsFilled[i] && roomsFilled[i] <= 35 && master === 0) {
                        newRooms.push(newMaster);
                        master = 1;
                    }
                }

                RoomType.insertMany(newRooms) 
                    .then(function() {
                        console.log("Available rooms updated!");
                        console.log(checkoutRooms);
                        console.log(checkoutRooms.length);
                    })
                    .catch(function(error) {
                        console.log(error);
                    })
                    .finally(function() {
                        res.redirect("/reserve");
                    });

                // setTimeout(() => {
                //     RoomType.insertMany(newRooms, function(error) {
                //         if (error) {
                //             console.log(error);
                //         } else {
                //             console.log("Available rooms updated!");
                //             console.log(checkoutRooms);
                //         }
                //     });
                // }, 500);
            }      
        }, 1000);         
    }    
    // setTimeout(() => {
    //     res.redirect("/reserve");
    // }, 1500);

});


//Allows app to run locally and on Heroku
app.listen(process.env.PORT || 3000, function() {
console.log("Server is running");
});