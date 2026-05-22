import CallSession from "../models/CallSession.js";

class CallSessionRepository {
  async findActiveCall(userId) {
    return CallSession.findOne({
      $or: [{ callerId: userId }, { receiverId: userId }],
      status: "active",
    }).populate("callerId receiverId", "fullName profilePic _id");
  }
}

export default new CallSessionRepository();
