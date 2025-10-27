// Import routes
const routes = require('../routes');

const schedule = require('node-schedule');

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

let dotenv = require('dotenv');
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

// Use routes BEFORE connecting to DB and starting server
app.use('/', routes);

// Connect to MongoDB
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
var mongoose = require('mongoose');

if (!dbUsername || !dbPassword) {
  console.error('ERROR: DB_USERNAME and DB_PASSWORD environment variables are required!');
} else {
  var connectionString  = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.vdh52.mongodb.net/Fighters-Edge?retryWrites=true&w=majority`;
  
  mongoose.connect(connectionString, {
    serverSelectionTimeoutMS: 5000
  }).catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "MongoDB connection error"));
  db.once("open", function () {
    console.log("MongoDB connection succeeded");
  });
}

// Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

const rule = new schedule.RecurrenceRule();

// const job = schedule.scheduleJob({hour: 00, minute: 00}, function(){
//   console.log('job running now....');
//   ratingUpdateScrapperController.scrapeContent();
// });
