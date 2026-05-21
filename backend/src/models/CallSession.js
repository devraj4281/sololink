import mongoose from "mongoose";

const callSessionSchema = new mongoose.Schema(
  {
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    type: {
      type: String,
      enum: ["call_voice", "call_video"],
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    // Reconnection tracking — prevents race conditions when both peers refresh
    reconnectingUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reconnectAttemptAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes to quickly find active calls for a user on reconnect
callSessionSchema.index({ callerId: 1, status: 1 });
callSessionSchema.index({ receiverId: 1, status: 1 });

const CallSession = mongoose.model("CallSession", callSessionSchema);

export default CallSession;
