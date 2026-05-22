import userRepository from "../repositories/user.repository.js";
import messageRepository from "../repositories/message.repository.js";
import conversationRepository from "../repositories/conversation.repository.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import AppError from "../lib/AppError.js";
import catchAsync from "../lib/catchAsync.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";

export const getAllContacts = catchAsync(async (req, res) => {
  const loggedInUserId = req.user._id;
  const filteredUsers = await userRepository.findManyWithoutPassword({ _id: { $ne: loggedInUserId } });
  res.status(200).json(filteredUsers);
});

export const getMessagesByUserId = catchAsync(async (req, res) => {
  const myId = req.user._id;
  const { id: userToChatId } = req.params;
  const { cursor } = req.query;

  let limit = parseInt(req.query.limit) || 20;
  limit = Math.max(1, Math.min(100, limit));

  const rawMessages = await messageRepository.findMessagesInThreadWithCursor(myId, userToChatId, cursor, limit);

  const hasMore = rawMessages.length > limit;
  const slicedMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
  const messages = slicedMessages.reverse();
  const nextCursor = hasMore && messages.length > 0 ? messages[0].createdAt : null;

  res.status(200).json({ messages, nextCursor, hasMore });
});

export const sendMessage = catchAsync(async (req, res) => {
  const { text, image, audio, audioDuration, replyToMessageId } = req.body;
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

  let audioUrl;
  if (audio) {
    const uploadResponse = await cloudinary.uploader.upload(audio, {
      resource_type: "video", // Cloudinary uses 'video' for audio files
      folder: "voice_messages",
    });
    audioUrl = uploadResponse.secure_url;
  }

  // Determine message type
  let msgType = "text";
  if (imageUrl) msgType = "image";
  if (audioUrl) msgType = "audio";

  const newMessage = await messageRepository.create({
    senderId,
    receiverId,
    text,
    image: imageUrl,
    audioUrl,
    audioDuration: audioDuration || 0,
    type: msgType,
    status: "sent",
    replyTo: replyToMessageId ? new mongoose.Types.ObjectId(replyToMessageId) : null,
  });

  // Populate replyTo for the response
  await newMessage.populate("replyTo", "text senderId audioUrl image type isDeleted");

  // Pre-compute/upsert conversation cached preview + increment receiver's unread count
  const lastMsgText = audioUrl ? "[Voice Message]" : text || "[Image]";
  await conversationRepository.updateLastMessage(senderId, receiverId, {
    text: lastMsgText,
    image: imageUrl || null,
    type: msgType,
    senderId,
    createdAt: newMessage.createdAt,
  }, true /* incrementUnread */);

  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  res.status(201).json(newMessage);
});

export const addReaction = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id.toString();

  if (!emoji) throw new AppError("Emoji is required.", 400);

  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError("Message not found.", 404);

  // Ensure the user is part of this conversation
  const isParticipant =
    message.senderId.toString() === userId || message.receiverId.toString() === userId;
  if (!isParticipant) throw new AppError("Unauthorized.", 403);

  // Get current reactors for this emoji
  const currentReactors = message.reactions.get(emoji) || [];

  // Toggle: if user already reacted, remove; otherwise add
  const alreadyReacted = currentReactors.map((id) => id.toString()).includes(userId);
  if (alreadyReacted) {
    const filtered = currentReactors.filter((id) => id.toString() !== userId);
    if (filtered.length === 0) {
      message.reactions.delete(emoji);
    } else {
      message.reactions.set(emoji, filtered);
    }
  } else {
    message.reactions.set(emoji, [...currentReactors, new mongoose.Types.ObjectId(userId)]);
  }

  message.markModified("reactions");
  await message.save();

  const eventName = alreadyReacted ? "message:reaction-removed" : "message:reaction-added";
  const payload = { messageId, emoji, userId, reactions: Object.fromEntries(message.reactions) };

  // Emit to both participants
  [message.senderId.toString(), message.receiverId.toString()].forEach((uid) => {
    const sid = getReceiverSocketId(uid);
    if (sid) io.to(sid).emit(eventName, payload);
  });

  res.status(200).json({ reactions: Object.fromEntries(message.reactions) });
});

export const deleteMessage = catchAsync(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id.toString();

  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError("Message not found.", 404);

  if (message.senderId.toString() !== userId) {
    throw new AppError("You can only delete your own messages.", 403);
  }

  // Optional: enforce 1-hour time limit
  // const oneHour = 60 * 60 * 1000;
  // if (Date.now() - new Date(message.createdAt).getTime() > oneHour) {
  //   throw new AppError("Cannot delete messages older than 1 hour.", 400);
  // }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.deletedBy = userId;
  message.text = null;
  message.image = null;
  message.audioUrl = null;
  await message.save();

  const payload = { messageId };

  [message.senderId.toString(), message.receiverId.toString()].forEach((uid) => {
    const sid = getReceiverSocketId(uid);
    if (sid) io.to(sid).emit("message:deleted", payload);
  });

  res.status(200).json({ success: true });
});

export const markAsRead = catchAsync(async (req, res) => {
  const { partnerId } = req.params;
  const myId = req.user._id;

  await conversationRepository.markAsRead(myId.toString(), partnerId);

  // Notify the sender that their messages have been read
  const senderSocketId = getReceiverSocketId(partnerId);
  if (senderSocketId) {
    io.to(senderSocketId).emit("conversation:read", { readBy: myId.toString() });
  }

  res.status(200).json({ success: true });
});

export const getChatPartners = catchAsync(async (req, res) => {
  const loggedInUserId = req.user._id;
  const conversations = await conversationRepository.findUserConversations(loggedInUserId);

  const chatPartners = conversations.map((conv) => {
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
      isOnline: partner.isOnline,
      lastSeen: partner.lastSeen,
      lastMessageAt: conv.updatedAt,
      lastMessage: conv.lastMessage,
      unreadCount: conv.unreadCount.get(loggedInUserId.toString()) || 0,
    };
  });

  res.status(200).json(chatPartners);
});

export const getCallHistory = catchAsync(async (req, res) => {
  const myId = req.user._id;
  const callLogs = await messageRepository.findCallLogs(myId, 100);
  res.status(200).json(callLogs);
});
