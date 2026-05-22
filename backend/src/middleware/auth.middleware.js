import jwt from "jsonwebtoken";
import userRepository from "../repositories/user.repository.js";
import { ENV } from "../lib/env.js";
import AppError from "../lib/AppError.js";
import catchAsync from "../lib/catchAsync.js";

export const protectRoute = catchAsync(async (req, res, next) => {
  const token = req.cookies.jwt_access;
  
  if (!token) {
    throw new AppError("Unauthorized - No access token provided", 401);
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await userRepository.findByIdWithoutPassword(decoded.userId);
    
    if (!user) {
      throw new AppError("Unauthorized - User not found", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const err = new AppError("Access token expired", 401);
      err.code = "TOKEN_EXPIRED";
      throw err;
    }
    throw new AppError("Unauthorized - Invalid access token", 401);
  }
});
