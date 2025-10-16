// Import routes
const routes = require('../routes');

const schedule = require('node-schedule');

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

let dotenv = require('dotenv');
dotenv.config();
var connectionString  = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
var mongoose = require('mongoose');

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())


mongoose.connect(connectionString);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function () {
  console.log("Connection Succeeded");
});

// app.listen(process.env.PORT || 8081);
app.listen(process.env.PORT || 80);   

const rule = new schedule.RecurrenceRule();

// const job = schedule.scheduleJob({hour: 00, minute: 00}, function(){
//   console.log('job running now....');
//   ratingUpdateScrapperController.scrapeContent();
// });

// Use routes
app.use('/', routes);
