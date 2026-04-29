var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  ImageUrl: {
    type: String
  },
  Slug: {
    type: String
  },
  /** Linked site user account (Mongo _id) — at most one player per account, one account per player */
  AccountId: {
    type: Schema.Types.ObjectId,
    ref: 'Accounts',
    default: null
  }
}, {
  timestamps: true, 
});

var Players = mongoose.model("Players", PlayerSchema);

module.exports = Players; 