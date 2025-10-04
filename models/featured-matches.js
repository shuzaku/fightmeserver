var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var FeaturedMatchesSchema = new Schema({
  VideoUrl: {
    type: String,
  },

  GameIds: {
    type: Array
  }
}, {
  timestamps: true, 
});

var FeaturedMatches = mongoose.model("featured-matches", FeaturedMatchesSchema);

module.exports = FeaturedMatches; 