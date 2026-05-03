var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentsSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  Games: [{
    type: ObjectId,
    ref: 'Games'
  }],
  LogoUrl: {
    type: String
  },
  EventDate: {
    type: Date
  },
  Location: {
    type: String
  },
  Series: {
    type: ObjectId
  },
  Image: {
    type: String
  },
  LogoUrl: {
    type: String
  },
  Tier: {
    type: Number
  },
  IsFinished: {
    type: Boolean,
    default: false
  },
  BracketUrl: {
    type: String
  },
  BracketFilters: [{
    type: String
  }],
}, {
  timestamps: true, 
});

var Tournaments = mongoose.model("Tournaments", TournamentsSchema);

module.exports = Tournaments;
