var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var EventSchema = new Schema({
   Name: {
      type: String,
      required: '{PATH} is required!'
    },
    Url: {
      type: String,
    },
    Date: {
      type: Date,
      required: '{PATH} is required!'
    },
    Type: {
      type: String,
      required: '{PATH} is required!'
    },
    ImageUrl: {
      type: String,
      required: '{PATH} is required!'
    }
  }, {
    timestamps: true, 
  });

var Events = mongoose.model("Events", EventSchema);

module.exports = Events; 

