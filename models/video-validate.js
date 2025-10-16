var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var VideoValidateSchema = new Schema({
  Url: {
    type: String,
    required: '{PATH} is required!'
  },
  VideoUrl: {
    type: String
  },
  GameId: {
    type: ObjectId
  },
  Team1Players: {
    type: Array
  },
  Team2Players: {
    type: Array
  },
  SubmittedBy: {
    type: ObjectId
  },
  UpdatedBy: {
    type: ObjectId
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
  Tags: {
    type: Array
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

var VideoValidate = mongoose.model("video-validate", VideoValidateSchema);

module.exports = VideoValidate;
