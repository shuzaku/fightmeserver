var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Tokens issued to external apps (e.g. the FightersEdge AutoStream desktop app)
// so they can authenticate as this user without re-entering credentials.
// TokenHash is a SHA-256 of the plaintext token — the plaintext is only
// returned to the client once, at creation time.
var DeviceTokenSchema = new Schema({
  TokenHash: { type: String, required: true },
  DeviceName: { type: String, default: 'Unnamed device' },
  LastUsedAt: { type: Date },
  RevokedAt: { type: Date },
}, {
  timestamps: true,
});

var AccountSchema = new Schema({
  DisplayName: {
    type: String,
    required: '{PATH} is required!'
  },
  Email: {
    type: String,
    required: '{PATH} is required!'
  },
  IsEmailVerified: {
    type: Boolean
  },
  AccountType: {
    type: String
  },
  Uid: {
    type: String
  },
  // Optional link to a Players document. Set by the user in their profile so
  // external apps (e.g. AutoStream) know which fighter they are.
  LinkedPlayerId: {
    type: Schema.Types.ObjectId,
    ref: 'Players',
  },
  DeviceTokens: {
    type: [DeviceTokenSchema],
    default: [],
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
  }
}, {
  timestamps: true, 
});

var Accounts = mongoose.model("Accounts", AccountSchema);

module.exports = Accounts; 