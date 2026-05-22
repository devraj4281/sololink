import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { generateTokens, clearTokens } from "../lib/utils.js";
import userRepository from "../repositories/user.repository.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";
import AppError from "../lib/AppError.js";
import catchAsync from "../lib/catchAsync.js";
import jwt from "jsonwebtoken";

export const signup = catchAsync(async (req, res) => {
  let { fullName, email, password } = req.body;
  email = email.toLowerCase();

  const userExists = await userRepository.exists({ email });
  if (userExists) {
    throw new AppError("Email already exists", 400);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await userRepository.create({
    fullName,
    email,
    password: hashedPassword,
  });

  // Generate dual-token cookies
  generateTokens(newUser._id, res);

  res.status(201).json({
    _id: newUser._id,
    fullName: newUser.fullName,
    email: newUser.email,
    profilePic: newUser.profilePic,
  });

  try {
    await sendWelcomeEmail(newUser.email, newUser.fullName, ENV.CLIENT_URL);
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
});

export const login = catchAsync(async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await userRepository.findOne({ email });
  if (!user) {
    throw new AppError("Invalid credentials", 400);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid credentials", 400);
  }

  // Generate dual-token cookies
  generateTokens(user._id, res);

  res.status(200).json({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    profilePic: user.profilePic,
  });
});

export const logout = (req, res) => {
  clearTokens(res);
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = catchAsync(async (req, res) => {
  const { profilePic } = req.body;
  const userId = req.user._id;

  const uploadResponse = await cloudinary.uploader.upload(profilePic);

  const updatedUser = await userRepository.findByIdAndUpdate(
    userId,
    { profilePic: uploadResponse.secure_url }
  );

  res.status(200).json(updatedUser);
});

export const refresh = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.jwt_refresh;
  
  if (!refreshToken) {
    throw new AppError("Unauthorized - No refresh token provided", 401);
  }

  try {
    const decoded = jwt.verify(refreshToken, ENV.JWT_SECRET);
    const user = await userRepository.findByIdWithoutPassword(decoded.userId);
    
    if (!user) {
      throw new AppError("Unauthorized - User not found", 401);
    }

    // Refresh both tokens
    generateTokens(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    throw new AppError("Unauthorized - Invalid or expired refresh token", 401);
  }
});
