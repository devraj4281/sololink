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
    type: {
      type: String,
      enum: ["text", "image", "call_voice", "call_video"],
      default: "text",
    },
    callDuration: {
      type: Number,
      default: 0,
    },
    callStatus: {
      type: String,
      enum: ["completed", "missed", "declined", "cancelled"],
      default: "completed",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;