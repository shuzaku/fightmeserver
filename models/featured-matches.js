var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var FeatureMatchesSchema = new Schema({
  MatchId: {
    type: ObjectId,
    index: true,
  },
  VideoUrl: {
    type: String
  },
  GameIds: {
    type: [ObjectId]
  },
  CreatorId: {
    type: ObjectId
  }
}, {
  timestamps: true, 
});

var FeaturedMatches = mongoose.model("featured-matches", FeatureMatchesSchema);

module.exports = FeaturedMatches; 