// Mirrors MicroServices/ranking-service/models/season-power-rankings.js —
// same collection, populated by that service's `npm run season` (a
// PGR/LumiRank-style iterative power ranking, computed fresh per calendar
// year — a separate system from player-ratings.js's live Glicko-2 rating).
// This copy lets the main API (and therefore the Vue app) read season
// ranking data — see service/season-power-rankings-service.js,
// controller/season-power-rankings.js, routes/season-power-rankings.js.
//
// Identity: a row may represent a player never matched to a Fighters-Edge
// PlayerId — see ranking-service's src/matching/entrant-identity.js.
// PlayerId is null in that case; UnresolvedName/StartggPlayerId are
// populated instead so there's still something to display, just no
// clickable player profile.
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var SeasonPowerRankingSchema = new Schema({
  IdentityKey: { type: String, required: true, index: true },
  PlayerId: { type: ObjectId, ref: 'Players', default: null, index: true },
  StartggPlayerId: { type: Number, default: null },
  UnresolvedName: { type: String, default: null },

  GameId: { type: ObjectId, ref: 'Games', required: true, index: true },
  Season: { type: Number, required: true, index: true },

  Score: { type: Number, required: true },
  Rank: { type: Number, required: true },
  TournamentsAttended: { type: Number, required: true },

  Iterations: { type: Number },
  Converged: { type: Boolean },
  ComputedAt: { type: Date },
}, {
  timestamps: true,
});

SeasonPowerRankingSchema.index({ IdentityKey: 1, GameId: 1, Season: 1 }, { unique: true });
SeasonPowerRankingSchema.index({ GameId: 1, Season: 1, Rank: 1 });

module.exports = mongoose.model("season-power-rankings", SeasonPowerRankingSchema);
