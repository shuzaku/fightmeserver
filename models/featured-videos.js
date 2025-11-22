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
  GameIds: {
    type: [ObjectId],
  },
  Type: {
    type: String,
    enum: ['Game', 'General'],
  }
}, {
  timestamps: true, 
});

var FeaturedVideos = mongoose.model("featured-videos", FeatureVideosSchema);

module.exports = FeaturedVideos; 