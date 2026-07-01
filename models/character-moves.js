var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var CharacterMoveSchema = new Schema({
  CharacterId: {
    type: ObjectId,
    required: '{PATH} is required!',
    index: true,
    ref: 'Characters',
  },
  MoveName: {
    type: String,
    required: '{PATH} is required!',
    trim: true,
  },
  ImageUrl: {
    type: String,
    trim: true,
  },
  // URL-safe identifier built from MoveName — used as dedupe key during bulk upsert.
  Slug: {
    type: String,
    trim: true,
  },
  // Source page the move was scraped from (for attribution / re-scrape targeting).
  WikiSourceUrl: {
    type: String,
    trim: true,
  },
  DisplayOrder: {
    type: Number,
    default: 0,
  },
  SubmittedBy: {
    type: ObjectId,
    ref: 'Accounts',
  },
}, {
  timestamps: true,
  collection: 'character-moves',
});

// Compound index for efficient dedupe queries during bulk upsert.
CharacterMoveSchema.index({ CharacterId: 1, Slug: 1 }, { unique: true, sparse: true });

var CharacterMoves = mongoose.model("CharacterMoves", CharacterMoveSchema);

module.exports = CharacterMoves;
