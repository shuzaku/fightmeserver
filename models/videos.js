var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var VideoSchema = new Schema({
  Url: {
    type: String,
    required: '{PATH} is required!'
  },
  ContentType: {
    type: String
  },
  ContentCreatorId: {
    type: ObjectId
  },
  VideoType: {
    type: String
  },
  StartTime: {
    type: String
  },
  UpdatedBy: {
    type: ObjectId
  },
  Views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
});

// Compound index covering the most common query: filter by ContentType, sort by _id
VideoSchema.index({ ContentType: 1, _id: -1 });
// Game + ContentType for game-filtered queries
VideoSchema.index({ GameId: 1, ContentType: 1, _id: -1 });
// Views for sort-by-popularity
VideoSchema.index({ ContentType: 1, Views: -1 });

var Videos = mongoose.model("Videos", VideoSchema);

module.exports = Videos; 