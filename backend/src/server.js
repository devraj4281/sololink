import express from 'express';
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv';
import { connectDB } from "./lib/db.js";
import path from "path";
import authRoutes from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import { ENV } from './lib/env.js';
import aj from './lib/arcjet.js';
import cors from "cors";

const app=express();
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

dotenv.config();
console.log(ENV.PORT);
const PORT =ENV.PORT||5000
const __dirname = path.resolve();


app.use(aj.expressMiddleware());

app.get("/", (req, res) => {
  res.send("Hello secure world!");
});

app.use("/api/auth", authRoutes);
app.use("/api/messages",messageRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT,()=>{
    console.log(`server is running at  http://localhost:${PORT}`);
    connectDB();
    
});