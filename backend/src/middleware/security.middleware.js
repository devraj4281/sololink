import rateLimit from "express-rate-limit";
import { ENV } from "../lib/env.js";
import AppError from "../lib/AppError.js";

// Rate limit for authentication attempts to prevent brute-force attacks
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF / Cross-Origin Origin checking middleware
export const csrfCheck = (req, res, next) => {
  // We only check state-changing requests
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const isDev = ENV.NODE_ENV === "development";

  // In development, allow any localhost origin (Vite can shift ports 5173→5175 etc.)
  if (isDev) {
    const isLocalhost = !origin || /^https?:\/\/localhost(:\d+)?$/.test(origin);
    if (isLocalhost) return next();
    // Also allow localhost referers
    const isLocalhostReferer = !referer || /^https?:\/\/localhost(:\d+)?\//.test(referer);
    if (isLocalhostReferer) return next();
  }

  const allowedOrigin = ENV.CLIENT_URL;

  // Production: enforce strict origin check
  if (origin && origin !== allowedOrigin) {
    return next(new AppError("CSRF Protection - Unauthorized origin request blocked", 403));
  }

  // Fallback to referer check
  if (!origin && referer && !referer.startsWith(allowedOrigin)) {
    return next(new AppError("CSRF Protection - Unauthorized referer request blocked", 403));
  }

  next();
};
