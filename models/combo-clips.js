var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var ComboClipSchema = new Schema({
  CharacterId: {
    type: ObjectId
  },
  Inputs: {
    type: Array
  },
  Hits: {
    type: Number
  },
  Damage: {
    type: Number
  },
  Tags: {
    type: Array
  },
  Url: {
    type: String,
  },
  VideoType: {
    type: String,
  },
  StartTime: {
    type: String,
  },
  EndTime: {
    type: String,
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
