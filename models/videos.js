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
  }
}, {
  timestamps: true,
});

var Videos = mongoose.model("Videos", VideoSchema);

module.exports = Videos; 