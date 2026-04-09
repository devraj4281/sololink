import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import { ENV } from "./lib/env.js";
import { app, server } from "./lib/socket.js";


dotenv.config();

const PORT = ENV.PORT || 5000;
const __dirname = path.resolve();

// MIDDLEWARES
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());

// TEST route
app.get("/", (req, res) => {
  res.send("Hello secure world!");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoute);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// START SERVER
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  connectDB();
});
