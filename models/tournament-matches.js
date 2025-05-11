var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentMatchesSchema = new Schema({
  Team1Players: {
    type: Array,
  },
  Team2Players: {
    type: Array,
  },
  VideoUrl: {
    type: String
  },
  GameId: {
    type: ObjectId
  },
  TournamentId: {
    type: ObjectId
  },
  Notes: {
    type: String
  },
  SecondaryNotes: {
    type: String
  },
  ClipStart: {
    type: String
  },
  ClipEnd: {
    type: String
  }
}, {
  timestamps: true, 
});

var Tournaments = mongoose.model("tournament-matches", TournamentMatchesSchema);

module.exports = Tournaments; 