// Mirrors MicroServices/ranking-service/models/player-ratings.js — same
// collection, populated by that service (Glicko-2 ratings computed from
// tournament-sets). This copy lets the main API (and therefore the Vue app)
// read rating/leaderboard data — see service/player-ratings-service.js,
// controller/player-ratings.js, routes/player-ratings.js.
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var PlayerRatingSchema = new Schema({
  PlayerId: { type: ObjectId, ref: 'Players', required: true, index: true },
  GameId: { type: ObjectId, ref: 'Games', required: true, index: true },

  Rating: { type: Number, required: true, default: 1500 },
  RatingDeviation: { type: Number, required: true, default: 350 },
  Volatility: { type: Number, required: true, default: 0.06 },

  // Derived lower-confidence-bound estimate (Rating - k*RD) — what the
  // leaderboard actually sorts by, so a barely-proven player with one big
  // win doesn't briefly outrank a well-established one. See
  // MicroServices/ranking-service/src/config/conservative-rating.js.
  ConservativeRating: { type: Number, required: true, default: 1500 - 1 * 350 },

  Wins: { type: Number, default: 0 },
  Losses: { type: Number, default: 0 },
  MatchesRated: { type: Number, default: 0 },

  LastEventAt: { type: Date },
  LastRatingPeriodIndex: { type: Number },

  History: [{
    _id: false,
    PeriodStart: { type: Date },
    Rating: { type: Number },
    RatingDeviation: { type: Number },
    MatchesInPeriod: { type: Number },
  }],
}, {
  timestamps: true,
});

PlayerRatingSchema.index({ PlayerId: 1, GameId: 1 }, { unique: true });
PlayerRatingSchema.index({ GameId: 1, Rating: -1 }); // raw-rating sort, kept for reference/debugging
PlayerRatingSchema.index({ GameId: 1, ConservativeRating: -1 }); // actual leaderboard sort

module.exports = mongoose.model("player-ratings", PlayerRatingSchema);
