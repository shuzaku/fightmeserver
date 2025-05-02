var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var FeaturedPlayerSchema = new Schema({
  PlayerId: {
    type: String,
    required: '{PATH} is required!'
  },
  FeaturedDate: {
    type: String
  }
}, {
  timestamps: true, 
});

var FeaturedPlayers = mongoose.model("Featured-Players", FeaturedPlayerSchema);

module.exports = FeaturedPlayers; 