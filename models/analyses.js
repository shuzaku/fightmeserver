var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var MatchAnalysisSchema = new Schema({
  MatchType: {
    type: String,
  },
  MatchId: {
    type: ObjectId,
  },
  Detections: {
    type: Array
  },
}, {
  timestamps: true, 
});

var MatchAnalysis = mongoose.model("analyses", MatchAnalysisSchema);

module.exports = MatchAnalysis; 