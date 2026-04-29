var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TournamentsSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  Games: {
    type: Array,
  },
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
    type: String
  },
  Image: {
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
  BracketFilter: {
    type: Array
  },
}, {
  timestamps: true, 
});

var Tournaments = mongoose.model("Tournaments", TournamentsSchema);

module.exports = Tournaments; 