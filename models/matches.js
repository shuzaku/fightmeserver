var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var MatchessSchema = new Schema({
  Team1Players: [{
    Slot: {
      type: Number,
    },
    Id: {
      type: ObjectId,
      required: true
    },
    CharacterIds: [{
      type: ObjectId
    }]
  }],
  Team2Players: [{
    Slot: {
      type: Number,
    },
    Id: {
      type: ObjectId,
      required: true
    },
    CharacterIds: [{
      type: ObjectId
    }]
  }],
  VideoUrl: {
    type: String
  },
  GameId: {
    type: ObjectId
  },
  GameVersion: {
    type: Number
  },
  Tags: {
    type: Array
  },
  WinningPlayersId: {
    type: Array
  },
  LosingPlayersId:{
    type: Array
  },
  SubmittedBy: {
    type: ObjectId
  },
  UpdatedBy: {
    type: ObjectId
  },
  StartTime: {
    type: String
  },
  EndTime: {
    type: String
  }
}, {
  timestamps: true, 
});

MatchessSchema.index({ _id: -1 });
MatchessSchema.index({ GameId: 1, _id: -1 });
MatchessSchema.index({ 'Team1Players.CharacterIds': 1, _id: -1 });
MatchessSchema.index({ 'Team2Players.CharacterIds': 1, _id: -1 });
MatchessSchema.index({ 'Team1Players.Id': 1, _id: -1 });
MatchessSchema.index({ 'Team2Players.Id': 1, _id: -1 });

var Matches = mongoose.model("Matches", MatchessSchema);

module.exports = Matches; 