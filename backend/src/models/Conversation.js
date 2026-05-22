import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      text: { type: String, default: "" },
      image: { type: String },
      type: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
    // ─── Unread Counters ──────────────────────────────────────────────────────
    // Maps userId (as string) → unread count for that user
    // Example: { 'user1Id': 0, 'user2Id': 3 }
    unreadCount: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
  },
  { timestamps: true }
);

// High-speed compound index for loading sorted chat lists
conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
