// Controller/Usernames.js
import mongoose from "mongoose";
import { getUsernameById, getUsernamesByIds } from "../lib/usernames.js";
import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";

export const getUsername = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });
        const out = await getUsernameById(id);
        if (!out) return res.status(404).json({ message: "User not found" });
        res.json(out);
    } catch (e) {
        res.status(500).json({ message: "Error fetching username", error: e.message });
    }
};

export const getUsernames = async (req, res) => {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
        if (!ids.length) return res.status(400).json({ message: "ids required" });
        const map = await getUsernamesByIds(ids);
        res.json(map);
    } catch (e) {
        res.status(500).json({ message: "Error fetching usernames", error: e.message });
    }
};

export const searchUsernames = async (req, res) => {
    try {
        const q = (req.query.q || "").toLowerCase().trim();
        if (!q || q.length < 2) return res.json([]);
        const rx = new RegExp("^" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
        const [students, faculties] = await Promise.all([
            Student.find({ username: { $regex: rx } }).select("_id username name").limit(10).lean(),
            Faculty.find({ username: { $regex: rx } }).select("_id username name").limit(10).lean(),
        ]);
        res.json([
            ...students.map(s => ({ id: s._id, role: "student", username: s.username, name: s.name })),
            ...faculties.map(f => ({ id: f._id, role: "faculty", username: f.username, name: f.name })),
        ]);
    } catch (e) {
        res.status(500).json({ message: "Error searching usernames", error: e.message });
    }
};
