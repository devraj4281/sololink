import CallSession from "../models/CallSession.js";

/**
 * GET /api/calls/active
 * Returns the active CallSession for the authenticated user, if any.
 * Used by the frontend on page load to check if a call was in progress.
 */
export const getActiveCall = async (req, res) => {
  try {
    const userId = req.user._id;

    const session = await CallSession.findOne({
      $or: [{ callerId: userId }, { receiverId: userId }],
      status: "active",
    }).populate("callerId receiverId", "fullName profilePic _id");

    if (!session) {
      return res.status(404).json({ message: "No active call found" });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching active call:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
