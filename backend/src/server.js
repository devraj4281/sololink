import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import callRoute from "./routes/call.route.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";
import { csrfCheck } from "./middleware/security.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";


dotenv.config();

const PORT = ENV.PORT || 5000;
const __dirname = path.resolve();

// MIDDLEWARES
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any localhost port in development (Vite shifts 5173→5174→5175)
      if (ENV.NODE_ENV === "development" && (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin))) {
        return callback(null, true);
      }
      if (origin === ENV.CLIENT_URL || !origin) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(csrfCheck);


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoute);
app.use("/api/calls", callRoute);

// Centralized error handling middleware
app.use(errorHandler);


// START SERVER
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  connectDB();
});
