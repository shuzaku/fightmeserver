var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var ComboClipSchema = new Schema({
  ComboId: {
    type: ObjectId
  },
  StartTime: {
    type: String,
  },
  EndTime: {
    type: String,
  },
  VideoId: {
    type: ObjectId,
    ref: 'Videos'
  },
  Url: {
    type: String,
  },
  VideoType: {
    type: String,
  },
  Tags: {
    type: Array
  },
  SubmittedBy: {
    type: ObjectId
  },
  UpdatedBy: {
    type: ObjectId
  }
}, {
  timestamps: true,
});

var ComboClip = mongoose.model("Combo-Clips", ComboClipSchema);

module.exports = ComboClip;