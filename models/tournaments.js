var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var TournamentsSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!'
  },
  Games: [{
    type: ObjectId,
    ref: 'Games'
  }],
  LogoUrl: {
    type: String
  },
  EventDate: {
    type: Date
  },
  Location: {
    type: String
  },
  Series: {
    type: ObjectId
  },
  Image: {
    type: String
  },
  LogoUrl: {
    type: String
  },
  Tier: {
    type: Number
  },
  IsFinished: {
    type: Boolean,
    default: false
  },
  BracketUrl: {
    type: String
  },
  BracketFilters: [{
    type: String
  }],

  // --- fields added for the Liquipedia/start.gg ingestion pipeline ---
  // (MicroServices/tournament-ingestion-service — see TOURNAMENT_INGESTION_PLAN.md
  // at the repo root). Additive only; existing manually-entered tournaments are
  // unaffected and simply have these fields unset.
  LiquipediaUrl: { type: String, index: true },
  LiquipediaPageTitle: { type: String },
  SourceGame: { type: String },
  // Single resolved game for auto-ingested (single-game) tournaments — distinct
  // from the curated `Games` array above, which can hold multiple games for
  // manually-entered multi-game majors/series.
  GameId: { type: ObjectId, ref: 'Games', index: true, sparse: true },
  StartggId: { type: Number, index: true, sparse: true },
  StartggEventId: { type: Number, index: true, sparse: true },
  StartggSlug: { type: String },
  EndDate: { type: Date },
  PrizePool: { type: Number },
  EntrantCount: { type: Number },
  SyncStatus: {
    type: String,
    // 'liquipedia-synced' — data parsed from Liquipedia bracket wikitext
    // rather than pulled from a matched start.gg event.
    enum: ['discovered', 'matched', 'unmatched', 'synced', 'liquipedia-synced', 'error'],
    index: true
  },
}, {
  timestamps: true,
});

var Tournaments = mongoose.model("Tournaments", TournamentsSchema);

module.exports = Tournaments;
