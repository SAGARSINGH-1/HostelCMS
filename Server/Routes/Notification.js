// Routes/Notification.js
import express from "express";
import { listMyNotifications, markRead, markAllRead } from "../Controller/Notification.js";
import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();

// router.use(protect);
router.get("/", listMyNotifications);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);

export default router;
