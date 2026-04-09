var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

var DetectionSchema = new Schema({
  label: { type: String },
  player: { type: String },
  timestamp: { type: String },
}, { _id: false });

var FrameDetectionSchema = new Schema({
  frame: { type: Number },
  time_seconds: { type: Number },
  timestamp: { type: String },
  player: { type: String },
  element: { type: String },
}, { _id: false });

var PlayerEventStatsSchema = new Schema({
  COUNTER: { type: Number },
  'PUNISH COUNTER': { type: Number },
  'HARD KNOCKDOWN': { type: Number },
  REVERSAL: { type: Number },
  'THROW ESCAPE': { type: Number },
}, { _id: false });

var SummarySchema = new Schema({
  total_events: { type: Number },
  video_duration_seconds: { type: Number },
  video_duration_timestamp: { type: String },
  video_duration_minutes: { type: Number },
  events_per_minute: { type: Number },
  unique_event_types: { type: Number },
  player_stats: {
    P1: { type: PlayerEventStatsSchema },
    P2: { type: PlayerEventStatsSchema },
  },
  task_duration_seconds: { type: Number },
  task_duration: { type: String },
}, { _id: false });

var VideoInfoSchema = new Schema({
  total_frames: { type: Number },
  processed_frames: { type: Number },
  frame_skip: { type: Number },
  fps: { type: Number },
  duration: { type: Number },
  resolution: { type: [Number] },
  task_duration_seconds: { type: Number },
  task_duration: { type: String },
  source: { type: String },
  youtube_url: { type: String },
  youtube_id: { type: String },
  youtube_title: { type: String },
  duration_timestamp: { type: String },
}, { _id: false });

var MatchAnalysisSchema = new Schema({
  MatchType: { type: String },
  MatchId: { type: ObjectId },
  match_lookup_found: { type: Boolean },
  analyzed_at: { type: Date },
  videoUrl: { type: String },
  video_path: { type: String },
  detector: { type: String },
  detector_detail: { type: String },
  summary: { type: SummarySchema },
  video_info: { type: VideoInfoSchema },
  player_stats: {
    P1: { type: PlayerEventStatsSchema },
    P2: { type: PlayerEventStatsSchema },
  },
  frame_detections: { type: [FrameDetectionSchema] },
  Detections: { type: [DetectionSchema] },
}, {
  timestamps: true,
});

var MatchAnalysis = mongoose.model("analyses", MatchAnalysisSchema);

module.exports = MatchAnalysis;
