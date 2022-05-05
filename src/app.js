//controllers
let accountController = require("../controller/accounts");
let characterController = require("../controller/characters");
let comboController = require("../controller/combos");
let comboClipController = require("../controller/combo-clip");
let creatorController = require("../controller/creators");
let gameController = require("../controller/games");
let playerController = require("../controller/players");
let tagController = require("../controller/tags");
let tournamentController = require("../controller/tournaments");
let videoController = require("../controller/videos");
let searchController = require("../controller/searches");
let matchController = require("../controller/matches");
let collectionController = require("../controller/collections");
let montageController = require("../controller/montages");
let moveController = require("../controller/moves");
let noteController = require("../controller/notes");
let characterMatchupController = require("../controller/character-matchups");

let ratingUpdateScrapperController = require("../controller/scrapper");


var moment = require('moment'); // require
const schedule = require('node-schedule');
const cheerio = require('cheerio');

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

app.listen(process.env.PORT || 8081);
// app.listen(process.env.PORT || 80);

const rule = new schedule.RecurrenceRule();

const job = schedule.scheduleJob({hour: 00, minute: 00}, function(){
  console.log('job running');
  ratingUpdateScrapperController.scrapeContent();
});

//Accounts
app.post('/accounts', (req, res) => accountController.addAccount(req,res));
app.get('/accounts/:id', (req, res) => accountController.getAccount(req,res));
app.put('/accounts/:id', (req, res) => accountController.patchAccount(req,res));

//Characters
app.post('/characters', (req, res) => characterController.addCharacter(req,res));
app.get('/characterQuery', (req, res) => characterController.queryCharacter(req,res));
app.get('/characters', (req, res) => characterController.getCharacters(res));
app.get('/characters/:id', (req, res) => characterController.getCharacter(req,res));
app.put('/characters/:id', (req, res) => characterController.updateCharacter(req,res));
app.delete('/characters/:id', (req, res) => characterController.deleteCharacter(req,res));
app.get('/characterMatchupInfo', (req, res) => characterController.getMatchupInfo(req,res));

//Combos
app.post('/combos', (req, res) => comboController.addCombo(req,res));
app.put('/combo/:id', (req, res) => comboController.patchCombo(req,res));
app.delete('/combo/:id', (req, res) => comboController.deleteCombo(req,res));
app.get('/comboClip/:id', (req, res) => comboClipController.getComboClip(req,res));

//Creators
app.post('/creator', (req, res) => creatorController.addCreator(req,res));
app.get('/creators', (req, res) => creatorController.getCreators(req,res));
app.get('/creators/:id', (req, res) => creatorController.getCreator(req,res));
app.put('/creators/:id', (req, res) => creatorController.updateCreator(req,res));
app.delete('/creators/:id', (req, res) => creatorController.deleteCreator(req,res));

//Games
app.post('/games', (req, res) => gameController.addGame(req,res));
app.get('/gameQuery', (req, res) => gameController.queryGame(req,res));
app.get('/games', (req, res) => gameController.getGames(req,res));
app.get('/games/:id', (req, res) => gameController.getGame(req,res));
app.put('/games/:id', (req, res) => gameController.updateGame(req,res));
app.delete('/games/:id', (req, res) => gameController.deleteGame(req,res));

//Players
app.post('/player', (req, res) => playerController.addPlayer(req,res));
app.get('/playerQuery', (req, res) => playerController.queryPlayer(req,res));
app.get('/players', (req, res) => playerController.getPlayers(req,res));
app.get('/players/:id', (req, res) => playerController.getPlayer(req,res));
app.put('/players/:id', (req, res) => playerController.updatePlayer(req,res));
app.delete('/players/:id', (req, res) => playerController.deletePlayer(req,res));

//Tags
app.post('/tags', (req, res) => tagController.addTag(req,res));
app.get('/tags', (req, res) => tagController.getTags(req,res));

//Tournament
app.post('/tournaments', (req, res) => tournamentController.addTournament(req,res));
app.get('/tournamentQuery', (req, res) => tournamentController.queryTournament(req,res));
app.get('/tournaments', (req, res) => tournamentController.getTournaments(req,res));
app.get('/tournaments/:id', (req, res) => tournamentController.getTournament(req,res));
app.put('/tournaments/:id', (req, res) => tournamentController.updateTournament(req,res));
app.delete('/tournaments/:id', (req, res) => tournamentController.deleteTournament(req,res));

//Videos
app.post('/video', (req, res) => videoController.addVideo(req,res));
app.get('/videoQuery', (req, res) => videoController.queryVideo(req,res));
app.get('/video/:id', (req, res) => videoController.getVideo(req,res));
app.put('/video/:id', (req, res) => videoController.patchVideo(req,res));
app.delete('/videos/:id', (req, res) => videoController.deleteVideo(req,res));
app.post('/getVideos', (req, res) => videoController.getVideos(req,res));
app.get('/comboVideo/:url', (req, res) => videoController.getComboVideo(req,res));
app.get('/matchVideo/:url', (req, res) => videoController.getMatchVideo(req,res));
app.get('/characterMatchup', (req, res) => videoController.getMatchupVideos(req,res));

//Search
app.get('/initialSearch', (req, res) => searchController.defaultSearch(req,res));
app.get('/search', (req, res) => searchController.getSearchValues(req,res));

//Matches
app.post('/matches', (req, res) => matchController.addMatches(req,res));
app.get('/matches', (req, res) => matchController.getMatches(req,res));
app.put('/matches/:id', (req, res) => matchController.patchMatch(req,res));
app.get('/match/:id', (req, res) => matchController.getMatch(req,res));
app.delete('/match/:id', (req, res) => matchController.deleteMatch(req,res));
app.get('/matchQuery', (req, res) => matchController.queryMatches(req,res));
app.put('/matches/', (req, res) => matchController.patchMatches(req,res));

//Collections
app.post('/collections', (req, res) => collectionController.addCollection(req,res));
app.get('/collectionQuery', (req, res) => collectionController.queryCollection(req,res));
app.put('/collections/:id', (req, res) => collectionController.patchCollection(req,res));
app.get('/collection/:id', (req, res) => collectionController.getCollection(req,res));

//Montages
app.post('/montages', (req, res) => montageController.addMontage(req,res));
app.get('/montage/:id', (req, res) => montageController.getMontage(req,res));

//Moves
app.get('/characterMoves/:id', (req, res) => moveController.getCharacterMoves(req,res));

//Notes
app.post('/notes', (req, res) => noteController.addNote(req,res));
app.get('/noteQuery', (req, res) => noteController.queryNote(req,res));
app.get('/notes', (req, res) => noteController.getNotes(req,res));
app.get('/notes/:id', (req, res) => noteController.getNote(req,res));
app.put('/notes/:id', (req, res) => noteController.updateNote(req,res));
app.delete('/notes/:id', (req, res) => noteController.deleteNote(req,res));


//Moves
app.get('/characterMatchupStat/', (req, res) => characterMatchupController.queryCharacterMatchup(req,res));