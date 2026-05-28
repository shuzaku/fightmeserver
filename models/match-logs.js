var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

// User-authored "match log" entries — the personal practice journal
// each player keeps for sets they've played online. Modeled after the
// spreadsheet flow described in product (Game / Date / Character /
// Opponent / Wins / Losses / Result / VideoUrl / Notes).
//
// All character/game fields are stored as plain strings so users can
// log any character (including 2XKO duos like "Yasuo/Arhi") without
// being constrained by the indexed Characters collection.
var MatchLogSchema = new Schema({
  Game: {
    type: String,
    required: '{PATH} is required!',
    trim: true,
  },
  Date: {
    type: Date,
    required: '{PATH} is required!',
  },
  UserCharacter: {
    type: String,
    required: '{PATH} is required!',
    trim: true,
  },
  OpponentCharacter: {
    type: String,
    required: '{PATH} is required!',
    trim: true,
  },
  Wins: {
    type: Number,
    default: 0,
    min: 0,
  },
  Losses: {
    type: Number,
    default: 0,
    min: 0,
  },
  Result: {
    type: String,
    enum: ['Won', 'Loss', 'Draw'],
  },
  VideoUrl: {
    type: String,
    trim: true,
  },
  Notes: {
    type: String,
    trim: true,
  },
  // Optional references for rich edit-mode restoration (not required so old
  // logs without them still load fine).
  // Set when a Match record was created alongside this log entry.
  MatchId: {
    type: ObjectId,
    ref: 'Matches',
  },
  GameId: {
    type: ObjectId,
    ref: 'Games',
  },
  UserCharacterIds: [{
    type: ObjectId,
    ref: 'Characters',
  }],
  OpponentCharacterIds: [{
    type: ObjectId,
    ref: 'Characters',
  }],
  AuthorId: {
    type: ObjectId,
    required: '{PATH} is required!',
    index: true,
  },
}, {
  timestamps: true,
});

MatchLogSchema.index({ AuthorId: 1, Date: -1 });
MatchLogSchema.index({ AuthorId: 1, Game: 1, Date: -1 });

var MatchLog = mongoose.model("MatchLogs", MatchLogSchema);

module.exports = MatchLog;
