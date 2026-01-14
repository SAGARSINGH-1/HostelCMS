import mongoose from "mongoose";
import StudentQuery from "../Model/StudentQuery.js";
import Notification from "../Model/Notification.js"; // NEW
import { getBucket } from "../lib/gridfs.js";
import { Readable } from "stream";
import { extractMentions } from "../lib/mentions.js";


// Allowed status values
const ALLOWED_STATUS = new Set(["pending", "in-progress", "resolved"]);

// helper: emit to a user's socket room if io is set on app
function emitToUser(req, userId, event, payload) {
    try {
        const io = req.app?.get?.("io");
        if (io && userId) io.to(String(userId)).emit(event, payload);
    } catch (e) {
        // non-fatal
    }
}

// Create a query (multipart form-data supported, files optional)
export const createQuery = async (req, res, next) => {
    try {
        const { student, title, description, tags } = req.body;

        if (!student || !mongoose.Types.ObjectId.isValid(student)) {
            return res.status(400).json({ message: "student missing/invalid" });
        }
        if (!title || !description) {
            return res.status(400).json({ message: "title and description required" });
        }

        // Extract mentions AFTER we have description
        const { mentions } = await extractMentions(description);

        const bucket = getBucket();
        const documents = [];

        // req.files should come from multer.memoryStorage() with .array("documents")
        const uploadFiles = req.files || [];

        for (const f of uploadFiles) {
            const filename = f.originalname;
            const metadata = { fieldname: f.fieldname, uploadedAt: new Date() };

            const readStream = Readable.from(f.buffer);
            const uploadStream = bucket.openUploadStream(filename, {
                contentType: f.mimetype,
                metadata,
            });

            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream).on("error", reject).on("finish", resolve);
            });

            documents.push({
                fileName: filename,
                fileType: f.mimetype,
                gridId: uploadStream.id,
                size: f.size,
            });
        }

        const newQuery = await StudentQuery.create({
            student,
            title,
            description,
            documents,
            status: "pending",
            tags: Array.isArray(tags) ? tags : tags ? [tags] : ["other"],
            mentions, // requires mentions in schema
        });

        // Notifications: mention -> one notification per unique user
        if (Array.isArray(mentions) && mentions.length) {
            const actorId = req.user?._id || student;
            const uniq = new Map(); // userId -> mention
            for (const m of mentions) {
                const key = String(m.userId);
                if (!uniq.has(key)) uniq.set(key, m);
            }
            const list = Array.from(uniq.values()).map((m) => ({
                user: m.userId,
                type: "mention",
                queryId: newQuery._id,
                triggeredBy: actorId,
                payload: {
                    title,
                    snippet: description.slice(0, 140),
                    username: m.username,
                    role: m.role,
                },
            }));
            // write notifications but don't block the response if it fails
            Notification.insertMany(list, { ordered: false }).catch(() => { });

            // optional real-time push
            for (const m of uniq.values()) {
                emitToUser(req, m.userId, "notify", {
                    kind: "mention",
                    queryId: newQuery._id,
                    title,
                });
            }
        }

        return res.status(201).json(newQuery);
    } catch (error) {
        console.error("createQuery error:", error);
        return res.status(500).json({ message: "Error creating query", error: error.message });
    }
};

// Get all queries for a student
export const getStudentQueries = async (req, res) => {
    try {
        const { studentId } = req.params;
        const filter = {};
        if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
            filter.student = studentId;
        }
        const queries = await StudentQuery.find(filter)
            .sort({ createdAt: -1 })
            .populate("student", "username name") // include username
            .lean();
        return res.status(200).json(queries);
    } catch (error) {
        console.error("getStudentQueries error:", error);
        return res.status(500).json({ message: "Error fetching queries", error: error.message });
    }
};

// Get single query by ID (with student info)
export const getQueryById = async (req, res) => {
    try {
        const query = await StudentQuery.findById(req.params.id)
            .populate("student", "name email username") // include username
            .lean();
        if (!query) return res.status(404).json({ message: "Query not found" });
        res.status(200).json(query);
    } catch (error) {
        console.error("getQueryById error:", error);
        res.status(500).json({ message: "Error fetching query", error: error.message });
    }
};

// Update a query (generic fields)
export const updateQuery = async (req, res) => {
    try {
        // Re-extract mentions if description changes
        if (typeof req.body?.description === "string") {
            const { mentions } = await extractMentions(req.body.description);
            req.body.mentions = mentions;
        }
        const updated = await StudentQuery.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate("student", "username name");

        // Optional: if description changed and mentions exist, notify new mentions
        if (req.body?.mentions?.length) {
            const actorId = req.user?._id || updated?.student;
            const uniq = new Map();
            for (const m of req.body.mentions) {
                const key = String(m.userId);
                if (!uniq.has(key)) uniq.set(key, m);
            }
            const list = Array.from(uniq.values()).map((m) => ({
                user: m.userId,
                type: "mention",
                queryId: updated._id,
                triggeredBy: actorId,
                payload: {
                    title: updated.title,
                    snippet: (req.body.description || updated.description || "").slice(0, 140),
                    username: m.username,
                    role: m.role,
                },
            }));
            Notification.insertMany(list, { ordered: false }).catch(() => { });
            for (const m of uniq.values()) {
                emitToUser(req, m.userId, "notify", {
                    kind: "mention",
                    queryId: updated._id,
                    title: updated.title,
                });
            }
        }

        return res.status(200).json(updated);
    } catch (error) {
        console.error("updateQuery error:", error);
        return res.status(500).json({ message: "Error updating query", error: error.message });
    }
};

// Faculty-only: update status with history
export const updateQueryStatusFaculty = async (req, res) => {
    try {
        const { status, note, updatedBy } = req.body;
        const query = await StudentQuery.findById(req.params.id);
        if (!query) return res.status(404).json({ message: "Query not found" });

        if (!ALLOWED_STATUS.has(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const oldStatus = query.status;

        query.status = status;
        query.statusHistory.push({
            from: oldStatus,
            to: status,
            note: note || "",
            at: new Date(),
            by: req.user._id,
            role: req.user.role,
            updatedBy,
        });

        await query.save();

        // Notify student about status change
        await Notification.create({
            user: query.student,
            type: "status-change",
            queryId: query._id,
            triggeredBy: req.user._id,
            payload: { from: oldStatus, to: status, note: note || "" },
        }).catch(() => { });
        emitToUser(req, query.student, "notify", { kind: "status-change", queryId: query._id });

        res.status(200).json(query);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete a query
export const deleteQuery = async (req, res) => {
    try {
        const doc = await StudentQuery.findByIdAndDelete(req.params.id);
        if (doc?.documents?.length) {
            const bucket = getBucket();
            await Promise.allSettled(
                doc.documents.filter((d) => d.gridId).map((d) => bucket.delete(d.gridId).catch(() => { }))
            );
        }
        return res.status(200).json({ message: "Query deleted successfully" });
    } catch (error) {
        console.error("deleteQuery error:", error);
        return res.status(500).json({ message: "Error deleting query", error: error.message });
    }
};

// Get top 20 latest queries (global)
export const getTopLatestQueries = async (req, res) => {
    try {
        const queries = await StudentQuery.find({})
            .sort({ createdAt: -1 })
            .limit(20)
            .populate("student", "username name")
            .lean();

        return res.status(200).json(queries);
    } catch (error) {
        console.error("getTopLatestQueries error:", error);
        return res.status(500).json({ message: "Error fetching latest queries", error: error.message });
    }
};

// Query statistics
export const getQueryStats = async (req, res) => {
    try {
        const total = await StudentQuery.countDocuments();
        const resolved = await StudentQuery.countDocuments({ status: "resolved" });
        const pending = await StudentQuery.countDocuments({ status: "pending" });

        const byTags = await StudentQuery.aggregate([
            { $unwind: "$tags" },
            {
                $group: {
                    _id: { tag: "$tags", status: "$status" },
                    count: { $sum: 1 },
                },
            },
        ]);

        return res.status(200).json({
            total,
            resolved,
            pending,
            byTags,
        });
    } catch (error) {
        console.error("getQueryStats error:", error);
        return res.status(500).json({ message: "Error fetching query stats", error: error.message });
    }
};
