import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    // ─── Audio / Voice Message ────────────────────────────────────────────────
    audioUrl: {
      type: String,
    },
    audioDuration: {
      type: Number, // seconds
      default: 0,
    },
    // ─── Message Type ─────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["text", "image", "audio", "call_voice", "call_video"],
      default: "text",
    },
    // ─── Call Metadata ────────────────────────────────────────────────────────
    callDuration: {
      type: Number,
      default: 0,
    },
    callStatus: {
      type: String,
      enum: ["completed", "missed", "declined", "cancelled"],
      default: "completed",
    },
    // ─── Delivery / Read Status ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    // ─── Emoji Reactions ──────────────────────────────────────────────────────
    // Stores: { '👍': [userId1, userId2], '❤️': [userId3] }
    reactions: {
      type: Map,
      of: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: () => new Map(),
    },
    // ─── Reply Threading ──────────────────────────────────────────────────────
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    // ─── Soft Delete ──────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, type: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, type: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;