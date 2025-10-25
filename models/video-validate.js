var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var VideoValidateSchema = new Schema({
  Url: {
    type: String,
    required: '{PATH} is required!'
  },
  VideoUrl: {
    type: String
  },
  GameId: {
    type: ObjectId,
    ref: 'Games'
  },
  Team1Players: [{
    Slot: {
      type: Number
    },
    Id: {
      type: ObjectId,
      required: true
    },
    CharacterIds: [{
      type: ObjectId
    }]
  }],
  Team2Players: [{
    Slot: {
      type: Number
    },
    Id: {
      type: ObjectId,
      required: true
    },
    CharacterIds: [{
      type: ObjectId
    }]
  }],
  SubmittedBy: {
    type: ObjectId
  },
  UpdatedBy: {
    type: ObjectId
  },
  ContentType: {
    type: String
  },
  ContentCreatorId: {
    type: ObjectId
  },
  VideoType: {
    type: String
  },
  Tags: {
    type: Array
  },
  StartTime: {
    type: String
  },
  EndTime: {
    type: String
  },
  Combos: [{
    CharacterId: [{
      type: ObjectId
    }],
    Inputs: {
      type: String
    },
    Damage: {
      type: String
    },
    Hits: {
      type: String
    },
    StartTime: {
      type: String
    },
    EndTime: {
      type: String
    },
    Note: {
      type: String
    }
  }]
}, {
  timestamps: true, 
});

var VideoValidate = mongoose.model("video-validate", VideoValidateSchema);

module.exports = VideoValidate;
