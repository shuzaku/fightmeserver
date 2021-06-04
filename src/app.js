//controllers
let accountController = require("../controller/accounts");
let characterController = require("../controller/characters");
let comboController = require("../controller/combos");
let creatorController = require("../controller/creators");
let gameController = require("../controller/games");
let playerController = require("../controller/players");
let tagController = require("../controller/tags");
let tournamentController = require("../controller/tournaments");
let videoController = require("../controller/videos");
let searchController = require("../controller/searches");
let matchController = require("../controller/matches");

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')

var mongoose = require('mongoose');

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())


mongoose.connect('mongodb+srv://mtchau:CSLNsZTp!pqf3cA@fightme2.vdh52.mongodb.net/%3Cdbname%3E?retryWrites=true&w=majority');
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function () {
  console.log("Connection Succeeded");
});


app.listen(process.env.PORT || 443);
// app.listen(process.env.PORT || 8082);

//Accounts
app.post('/accounts', (req, res) => accountController.addAccount(req,res));

//Characters
app.post('/characters', (req, res) => characterController.addCharacter(req,res));
app.get('/characterQuery', (req, res) => characterController.queryCharacter(req,res));
app.get('/characters', (req, res) => characterController.getCharacters(req,res));
app.get('/characters/:id', (req, res) => characterController.getCharacter(req,res));
app.put('/characters/:id', (req, res) => characterController.updateCharacter(req,res));
app.delete('/characters/:id', (req, res) => characterController.deleteCharacter(req,res));

//Combos
app.post('/combos', (req, res) => comboController.addCombo(req,res));
app.put('/combo/:id', (req, res) => comboController.patchCombo(req,res));

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
app.post('/tournament', (req, res) => tournamentController.addTournament(req,res));
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

//Search
app.get('/search', (req, res) => searchController.getSearchValues(req,res));

//Matches
app.post('/matches', (req, res) => matchController.addMatches(req,res));
app.get('/matches', (req, res) => matchController.getMatches(req,res));
