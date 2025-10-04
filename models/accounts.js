var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var AccountSchema = new Schema({
  DisplayName: {
    type: String,
    required: '{PATH} is required!'
  },
  Email: {
    type: String,
    required: '{PATH} is required!'
  },
  Password: {
    type: String,
    required: false // Make optional for existing users
  },
  IsEmailVerified: {
    type: Boolean
  },
  AccountType: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  Uid: {
    type: String
  },
  FavoriteVideos: {
    type: Array
  },
  Collections: {
    type: Array
  },
  FollowedPlayers: {
    type: Array
  },
  FollowedCharacters: {
    type: Array
  },
  FollowedGames: {
    type: Array
  },
  NeedsPasswordReset: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, 
});

var Accounts = mongoose.model("Accounts", AccountSchema);

module.exports = Accounts; 