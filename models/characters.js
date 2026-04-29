var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var CharacterSchema = new Schema({
  Name: {
    type: String,
    required: "{PATH} is required!",
  },
  GameId: {
    type: Schema.Types.ObjectId,
    ref: "Games",
    required: "{PATH} is required!",
  },
  ImageUrl: {
    type: String,
  },
  AvatarUrl: {
    type: String,
  },
  Slug: {
    type: String,
    trim: true,
    index: true,
    sparse: true,
  },
  Archetype: {
    type: String,
    trim: true,
  },
  Gameplan: {
    type: String,
    trim: true,
  },
  Strengths: {
    type: String,
    trim: true,
  },
  Weakness: {
    type: String,
    trim: true,
  },
  releaseDate: {
    type: Date,
  },
  OverviewUrl: {
    type: String,
    trim: true,
  },
  Wiki: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

var Characters = mongoose.model("Characters", CharacterSchema);

module.exports = Characters;
