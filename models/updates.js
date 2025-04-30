var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UpdatesSchema = new Schema({
  Type: {
    type: String,
    required: '{PATH} is required!'
  },
  SubType: {
    type: Array,
  },
  Games: {
    type: Array
  },
  Note: {
    type: String
  },
  Date: {
    type: Date
  },
  Image: {
    type: String
  },
  Link: {
    type: String
  }
}, {
  timestamps: true, 
});

var Updates = mongoose.model("Updates", UpdatesSchema);

module.exports = Updates; 