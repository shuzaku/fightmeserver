var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PlayerLinkRequestSchema = new Schema(
  {
    AccountId: {
      type: Schema.Types.ObjectId,
      ref: "Accounts",
      required: true,
    },
    PlayerId: {
      type: Schema.Types.ObjectId,
      ref: "Players",
      required: true,
    },
    Status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    RejectionNote: {
      type: String,
    },
  },
  { timestamps: true }
);

PlayerLinkRequestSchema.index({ AccountId: 1, PlayerId: 1 }, { unique: true });

var PlayerLinkRequest = mongoose.model("PlayerLinkRequests", PlayerLinkRequestSchema);

module.exports = PlayerLinkRequest;
