var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var MatchNoteSchema = new Schema({
  MatchId: {
    type: ObjectId,
    required: '{PATH} is required!',
    ref: 'Matches'
  },
  AuthorId: {
    type: ObjectId,
    required: '{PATH} is required!',
    ref: 'Accounts'
  },
  Content: {
    type: String,
    required: '{PATH} is required!'
  },
  Heading: {
    type: String,
    default: null
  },
  Timestamp: {
    type: Number,
    default: null
  },
  Likes: {
    type: Number,
    default: 0
  },
  LikedBy: [{
    type: ObjectId,
    ref: 'Accounts'
  }],
  IsPinned: {
    type: Boolean,
    default: false
  },
  IsEdited: {
    type: Boolean,
    default: false
  },
  IsDeleted: {
    type: Boolean,
    default: false
  },
  DeletedAt: {
    type: Date,
    default: null
  },
  ReportCount: {
    type: Number,
    default: 0
  },
  ReportedBy: [{
    type: ObjectId,
    ref: 'Accounts'
  }],
  ParentNoteId: {
    type: ObjectId,
    ref: 'MatchNotes',
    default: null
  },
  ReplyCount: {
    type: Number,
    default: 0
  },
  Tags: [{
    type: String
  }],
  GameId: {
    type: ObjectId,
    ref: 'Games',
    default: null
  },
  CreatedAt: {
    type: Date,
    default: Date.now
  },
  UpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'match-notes'
});

// Indexes for better query performance
MatchNoteSchema.index({ MatchId: 1, CreatedAt: -1 });
MatchNoteSchema.index({ MatchId: 1, Timestamp: 1 });
MatchNoteSchema.index({ MatchId: 1, IsPinned: -1, CreatedAt: -1 });
MatchNoteSchema.index({ MatchId: 1, IsDeleted: 1 });
MatchNoteSchema.index({ AuthorId: 1 });

var MatchNotes = mongoose.model("Match-Notes", MatchNoteSchema);

module.exports = MatchNotes;

