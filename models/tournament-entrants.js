// Mirrors MicroServices/tournament-ingestion-service/models/tournament-entrants.js
// — same collection, populated by that service. This copy lets the main API
// (and therefore the Vue app) read entrant data.
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentEntrantSchema = new Schema({
  TournamentId: { type: ObjectId, ref: 'Tournaments', required: true, index: true },
  // See tournament-sets.js — Liquipedia rows have no start.gg ids.
  Source: { type: String, enum: ['startgg', 'liquipedia'], default: 'startgg', index: true },
  SourceKey: { type: String },

  StartggEntrantId: { type: Number, index: true },
  StartggParticipantId: { type: Number },
  RawName: { type: String, required: true },
  Seed: { type: Number },
  FinalPlacement: { type: Number },

  PlayerId: { type: ObjectId, ref: 'Players', default: null, index: true },
  MatchConfidence: { type: Number },
  MatchMethod: {
    type: String,
    enum: ['exact-name', 'exact-slug', 'fuzzy', 'unmatched'],
    default: 'unmatched'
  },
}, {
  timestamps: true,
});

// Partial for the same reason as tournament-sets — see that file's comment.
TournamentEntrantSchema.index(
  { TournamentId: 1, StartggEntrantId: 1 },
  { unique: true, partialFilterExpression: { StartggEntrantId: { $exists: true } }, name: 'tent_tid_startgg_uniq' }
);
TournamentEntrantSchema.index(
  { TournamentId: 1, Source: 1, SourceKey: 1 },
  { unique: true, partialFilterExpression: { SourceKey: { $exists: true } }, name: 'tent_tid_source_key_uniq' }
);

module.exports = mongoose.model("tournament-entrants", TournamentEntrantSchema);
