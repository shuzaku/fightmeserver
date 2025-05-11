var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var FeatureVideosSchema = new Schema({
  VideoUrl: {
    type: String,
  },
  CreatorId: {
    type: ObjectId,
  },
  VideoUrl: {
    type: String
  },
  GameIds: {
    type: Array
  }
}, {
  timestamps: true, 
});

var FeaturedVideos = mongoose.model("featured-videos", FeatureVideosSchema);

module.exports = FeaturedVideos; 