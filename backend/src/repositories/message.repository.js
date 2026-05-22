import Message from "../models/Message.js";

class MessageRepository {
  async create(data) {
    const message = new Message(data);
    return message.save();
  }

  async findMessagesInThreadWithCursor(myId, partnerId, cursor, limit = 20) {
    const query = {
      $or: [
        { senderId: myId, receiverId: partnerId },
        { senderId: partnerId, receiverId: myId },
      ],
    };


    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1);
  }

  async findCallLogs(myId, limit = 100) {
    return Message.find({
      $or: [{ senderId: myId }, { receiverId: myId }],
      type: { $in: ["call_voice", "call_video"] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");
  }
}

export default new MessageRepository();
