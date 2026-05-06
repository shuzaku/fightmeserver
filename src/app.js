// Import routes
const routes = require('../routes');
const prerenderMiddleware = require('../middleware/prerender');

const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');

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

// ── Prerender middleware (must come before API routes and static serving) ──
// Intercepts social media bot requests and serves OG-enriched HTML.
app.use(prerenderMiddleware);

// Use API routes — prefixed with /api/ to avoid colliding with Vue Router paths
// e.g. GET /api/match/:id returns JSON; GET /match/:id falls through to the SPA
app.use('/api', routes);

// ── Serve Vue SPA static files (if dist/ exists) ──────────────────────────
// Build the Vue app (`npm run build`) and copy the dist/ folder here so the
// Node server can serve both the API and the frontend from the same origin.
// When fighters-edge.com points to this server, bots get OG tags and humans
// get the SPA as normal.
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback: send index.html for any unmatched route (Vue Router handles it)
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  console.log('[static] Serving Vue SPA from dist/');
} else {
  console.log('[static] No dist/ folder found — API-only mode');
}

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
const port = process.env.PORT || 80;
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
