// Mirrors MicroServices/tournament-ingestion-service/models/tournament-sets.js
// — same collection, populated by that service.
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentSetSchema = new Schema({
  TournamentId: { type: ObjectId, ref: 'Tournaments', required: true, index: true },

  // Rows can come from start.gg (keyed by StartggSetId) or from Liquipedia
  // bracket wikitext (no start.gg id — keyed by SourceKey instead).
  Source: { type: String, enum: ['startgg', 'liquipedia'], default: 'startgg', index: true },
  SourceKey: { type: String },

  StartggSetId: { type: Number, index: true },
  PhaseName: { type: String },
  RoundText: { type: String },

  Entrant1Id: { type: ObjectId, ref: 'tournament-entrants' },
  Entrant2Id: { type: ObjectId, ref: 'tournament-entrants' },
  Entrant1Score: { type: Number },
  Entrant2Score: { type: Number },
  WinnerEntrantId: { type: ObjectId, ref: 'tournament-entrants' },

  CompletedAt: { type: Date },
}, {
  timestamps: true,
});

// Partial so a missing StartggSetId doesn't collide across Liquipedia rows.
// Created/migrated by MicroServices/tournament-ingestion-service's
// scripts/migrate-source-keys.js — this copy just needs to agree.
TournamentSetSchema.index(
  { TournamentId: 1, StartggSetId: 1 },
  { unique: true, partialFilterExpression: { StartggSetId: { $exists: true } }, name: 'tsets_tid_startgg_uniq' }
);
TournamentSetSchema.index(
  { TournamentId: 1, Source: 1, SourceKey: 1 },
  { unique: true, partialFilterExpression: { SourceKey: { $exists: true } }, name: 'tsets_tid_source_key_uniq' }
);

module.exports = mongoose.model("tournament-sets", TournamentSetSchema);
