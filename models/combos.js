var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var ComboSchema = new Schema({
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
  }
}, {
  timestamps: true, 
});

var Combo = mongoose.model("Combo", ComboSchema);

module.exports = Combo; 