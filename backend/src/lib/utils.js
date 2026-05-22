import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateTokens = (userId, res) => {
  const { JWT_SECRET } = ENV;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  // Short-lived access token
  const accessToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "15m",
  });

  // Long-lived refresh token
  const refreshToken = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProd = ENV.NODE_ENV === "production";

  // Set access token cookie
  res.cookie("jwt_access", accessToken, {
    maxAge: 15 * 60 * 1000, // 15 mins
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
  });

  // Set refresh token cookie
  res.cookie("jwt_refresh", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
  });

  return { accessToken, refreshToken };
};

export const clearTokens = (res) => {
  const isProd = ENV.NODE_ENV === "production";

  res.cookie("jwt_access", "", {
    maxAge: 0,
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
  });
  res.cookie("jwt_refresh", "", {
    maxAge: 0,
    httpOnly: true,
    secure: isProd,
    sameSite: "Lax",
  });
};
