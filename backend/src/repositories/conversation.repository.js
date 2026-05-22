import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

class ConversationRepository {
  async findUserConversations(userId) {
    const uId = new mongoose.Types.ObjectId(userId.toString());
    return Conversation.find({
      participants: uId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "email fullName profilePic createdAt updatedAt");
  }

  async updateLastMessage(senderId, receiverId, lastMessageData) {
    const sId = new mongoose.Types.ObjectId(senderId.toString());
    const rId = new mongoose.Types.ObjectId(receiverId.toString());

    const lastMessage = {
      text: lastMessageData.text || "",
      image: lastMessageData.image || null,
      type: lastMessageData.type || "text",
      senderId: new mongoose.Types.ObjectId(lastMessageData.senderId.toString()),
      createdAt: lastMessageData.createdAt || new Date(),
    };

    let conversation = await Conversation.findOne({
      participants: { $all: [sId, rId] },
    });

    if (conversation) {
      conversation.lastMessage = lastMessage;
      return conversation.save();
    } else {
      return Conversation.create({
        participants: [sId, rId],
        lastMessage,
      });
    }
  }
}

export default new ConversationRepository();
