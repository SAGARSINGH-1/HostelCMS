// Routes/Usernames.js
import express from "express";
import { getUsername, getUsernames, searchUsernames } from "../Controller/Usernames.js";
// import { protect } from "../Middleware/authMiddleware.js";

const router = express.Router();
// router.use(protect()); // optionally protect
router.get("/search", searchUsernames);
router.get("/:id", getUsername);
router.post("/batch", getUsernames);

export default router;
