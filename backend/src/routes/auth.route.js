import express from "express";
import { signup, login, logout, updateProfile, refresh } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { authRateLimiter } from "../middleware/security.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { signupSchema, loginSchema, updateProfileSchema } from "../validators/auth.validator.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", authRateLimiter, validateBody(signupSchema), signup);
router.post("/login", authRateLimiter, validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, validateBody(updateProfileSchema), updateProfile);

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

export default router;
