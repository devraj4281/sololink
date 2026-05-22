import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

class ConversationRepository {
  async findUserConversations(userId) {
    const uId = new mongoose.Types.ObjectId(userId.toString());
    return Conversation.find({
      participants: uId,
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "email fullName profilePic createdAt updatedAt isOnline lastSeen");
  }

  async updateLastMessage(senderId, receiverId, lastMessageData, incrementUnread = false) {
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
      if (incrementUnread) {
        // Increment unread count for the receiver (rId)
        const receiverKey = rId.toString();
        const current = conversation.unreadCount.get(receiverKey) || 0;
        conversation.unreadCount.set(receiverKey, current + 1);
      }
      return conversation.save();
    } else {
      const unreadCount = new Map();
      if (incrementUnread) {
        unreadCount.set(rId.toString(), 1);
      }
      return Conversation.create({
        participants: [sId, rId],
        lastMessage,
        unreadCount,
      });
    }
  }

  async markAsRead(senderId, receiverId) {
    const sId = new mongoose.Types.ObjectId(senderId.toString());
    const rId = new mongoose.Types.ObjectId(receiverId.toString());

    const conversation = await Conversation.findOne({
      participants: { $all: [sId, rId] },
    });

    if (conversation) {
      // Reset unread count for the user who is reading (senderId is the one reading)
      conversation.unreadCount.set(senderId.toString(), 0);
      return conversation.save();
    }
    return null;
  }
}

export default new ConversationRepository();
