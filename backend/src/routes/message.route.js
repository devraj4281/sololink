import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  getCallHistory,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { sendMessageSchema } from "../validators/message.validator.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/call-history", getCallHistory);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", validateBody(sendMessageSchema), sendMessage);

export default router;
