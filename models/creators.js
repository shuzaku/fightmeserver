var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var CreatorsSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  // Canonical channel / profile page (YouTube @handle, twitter.com/user, etc.)
  Url: {
    type: String,
    index: true,
  },
  LogoUrl: {
    type: String,
  },
  YoutubeUrl: {
    type: String
  },
  YoutubeId: {
    type: String
  }
}, {
  timestamps: true, 
});

var Creators = mongoose.model("Creators", CreatorsSchema);

module.exports = Creators; 