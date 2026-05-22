import userRepository from "../repositories/user.repository.js";
import messageRepository from "../repositories/message.repository.js";
import conversationRepository from "../repositories/conversation.repository.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import AppError from "../lib/AppError.js";
import catchAsync from "../lib/catchAsync.js";

export const getAllContacts = catchAsync(async (req, res) => {
  const loggedInUserId = req.user._id;
  const filteredUsers = await userRepository.findManyWithoutPassword({ _id: { $ne: loggedInUserId } });

  res.status(200).json(filteredUsers);
});

export const getMessagesByUserId = catchAsync(async (req, res) => {
  const myId = req.user._id;
  const { id: userToChatId } = req.params;
  const { cursor } = req.query;

  // Enforce secure pagination bounds
  let limit = parseInt(req.query.limit) || 20;
  limit = Math.max(1, Math.min(100, limit));

  // Retrieve batch (limit + 1) sorted chronologically descending
  const rawMessages = await messageRepository.findMessagesInThreadWithCursor(myId, userToChatId, cursor, limit);

  const hasMore = rawMessages.length > limit;
  const slicedMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;

  // We want to return the batch chronologically ascending for standard chat scrolling
  const messages = slicedMessages.reverse();

  // If there are more messages, nextCursor is the oldest message timestamp in this batch
  const nextCursor = hasMore && messages.length > 0 ? messages[0].createdAt : null;

  res.status(200).json({
    messages,
    nextCursor,
    hasMore,
  });
});

export const sendMessage = catchAsync(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const senderId = req.user._id;

  if (senderId.toString() === receiverId.toString()) {
    throw new AppError("Cannot send messages to yourself.", 400);
  }

  const receiverExists = await userRepository.exists({ _id: receiverId });
  if (!receiverExists) {
    throw new AppError("Receiver not found.", 404);
  }

  let imageUrl;
  if (image) {
    const uploadResponse = await cloudinary.uploader.upload(image);
    imageUrl = uploadResponse.secure_url;
  }

  // Save the new Message
  const newMessage = await messageRepository.create({
    senderId,
    receiverId,
    text,
    image: imageUrl,
    type: imageUrl ? "image" : "text",
  });

  // Pre-compute/upsert conversation cached preview
  await conversationRepository.updateLastMessage(senderId, receiverId, {
    text: text || "[Image]",
    image: imageUrl || null,
    type: imageUrl ? "image" : "text",
    senderId,
    createdAt: newMessage.createdAt,
  });

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  res.status(201).json(newMessage);
});

export const getChatPartners = catchAsync(async (req, res) => {
  const loggedInUserId = req.user._id;

  // Query pre-computed Conversations index
  const conversations = await conversationRepository.findUserConversations(loggedInUserId);

  const chatPartners = conversations.map((conv) => {
    // Locate the other peer in the participants array
    const partner = conv.participants.find(
      (part) => part._id.toString() !== loggedInUserId.toString()
    );

    return {
      _id: partner._id,
      email: partner.email,
      fullName: partner.fullName,
      profilePic: partner.profilePic,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
      lastMessageAt: conv.updatedAt,
      lastMessage: conv.lastMessage,
    };
  });

  res.status(200).json(chatPartners);
});

export const getCallHistory = catchAsync(async (req, res) => {
  const myId = req.user._id;
  const callLogs = await messageRepository.findCallLogs(myId, 100);

  res.status(200).json(callLogs);
});
