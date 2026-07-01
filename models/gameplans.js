var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var NodeSchema = new Schema({
  id: { type: String, required: true },
  moveId: { type: ObjectId, ref: 'CharacterMoves' },
  moveName: { type: String },
  imageUrl: { type: String },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  note: { type: String },
  type: { type: String },
  text: { type: String },
  color: { type: String },
}, { _id: false });

var EdgeSchema = new Schema({
  id: { type: String, required: true },
  fromNodeId: { type: String, required: true },
  toNodeId: { type: String, required: true },
  label: { type: String },
  style: { type: String },
  color: { type: String },
  arrowType: { type: String },
}, { _id: false });

var GameplanSchema = new Schema({
  Name: {
    type: String,
    required: '{PATH} is required!',
    trim: true,
  },
  CharacterId: {
    type: ObjectId,
    required: '{PATH} is required!',
    ref: 'Characters',
    index: true,
  },
  Character2Id: {
    type: ObjectId,
    ref: 'Characters',
    index: true,
  },
  GameId: {
    type: ObjectId,
    ref: 'Games',
    index: true,
  },
  OwnerId: {
    type: ObjectId,
    required: '{PATH} is required!',
    ref: 'Accounts',
    index: true,
  },
  Nodes: [NodeSchema],
  Edges: [EdgeSchema],
  Viewport: {
    scale: { type: Number, default: 1 },
    offsetX: { type: Number, default: 0 },
    offsetY: { type: Number, default: 0 },
  },
  IsPublic: {
    type: Boolean,
    default: false,
    index: true,
  },
}, {
  timestamps: true,
});

var Gameplans = mongoose.model("Gameplans", GameplanSchema);

module.exports = Gameplans;
