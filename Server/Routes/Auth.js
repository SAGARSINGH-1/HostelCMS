import express from "express";
import { studentSignup, studentLogin, facultySignup, facultyLogin } from "../Controller/Auth.js";
import { protect } from "../Middleware/authMiddleware.js";
import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";
import usernamesRouter from "./Usernames.js";
const app = express();

app.use("/usernames", usernamesRouter);
const router = express.Router();

// Student
router.post("/student/signup", studentSignup);
router.post("/student/login", studentLogin);

// Faculty
router.post("/faculty/signup", facultySignup);
router.post("/faculty/login", facultyLogin);





router.get("/me", protect(), async (req, res) => {
    try {
        let user;
        if (req.user.role === "student") {
            user = await Student.findById(req.user.id).select("-password");
        } else if (req.user.role === "faculty") {
            user = await Faculty.findById(req.user.id).select("-password");
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            ...user.toObject(),
            role: req.user.role, // ✅ return role
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;
