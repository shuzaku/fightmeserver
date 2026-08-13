// Mirrors MicroServices/tournament-ingestion-service/models/tournament-standings.js
// — same collection, populated by that service.
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentStandingSchema = new Schema({
  TournamentId: { type: ObjectId, ref: 'Tournaments', required: true, index: true },
  EntrantId: { type: ObjectId, ref: 'tournament-entrants', required: true },
  PlayerId: { type: ObjectId, ref: 'Players', default: null, index: true },

  Placement: { type: Number, required: true, index: true },

  // Provenance. 'derived' means the placement was inferred from Liquipedia
  // bracket results rather than read from a prize pool or start.gg.
  Source: { type: String, enum: ['startgg', 'prize-pool', 'derived'], default: 'startgg', index: true },
  PlacementConfidence: { type: String, enum: ['high', 'medium'], default: undefined },
  Seed: { type: Number },
  PrizeAmount: { type: Number },
}, {
  timestamps: true,
});

TournamentStandingSchema.index({ TournamentId: 1, EntrantId: 1 }, { unique: true });

module.exports = mongoose.model("tournament-standings", TournamentStandingSchema);
