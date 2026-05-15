var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  ImageUrl: {
    type: String
  },
  Slug: {
    type: String
  },
  MatchupAppearance: {
    type: Number,
    default: 0,
    index: true,
  },
  /** Games the player competes in, with the characters they play per game */
  GamesPlayed: [{
    Game: { type: Schema.Types.ObjectId, ref: 'Games' },
    Characters: [{ type: Schema.Types.ObjectId, ref: 'Characters' }]
  }],
  /** Linked site user account (Mongo _id) — at most one player per account, one account per player */
  AccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Accounts',
    default: null
  }
}, {
  timestamps: true, 
});

var Players = mongoose.model("Players", PlayerSchema);

module.exports = Players; 