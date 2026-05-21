import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { getActiveCall } from "../controllers/call.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/active", getActiveCall);

export default router;
