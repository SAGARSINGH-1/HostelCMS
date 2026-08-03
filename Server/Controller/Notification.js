// Controller/Notification.js
import Notification from "../Model/Notification.js";

export const listMyNotifications = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!["mention", "status-change", "assigned"].includes(req.params.value)) {
            return res.status(400).json({ message: "Invalid notification type" })
        }

        // Optional: narrow fields for lighter payloads
        const items = await Notification.find({ user: req.user.id, type: req.params.value })
            .populate("triggeredBy", "name role") // only populate name and role
            .populate("queryId", "title") // only populate title
            .sort({ createdAt: -1 })
            .lean(); // return plain JS objects for better performance

        return res.json(items);
    } catch (err) {
        // Log concise info; do not log full req
        console.error("listMyNotifications error:", err?.message);
        return next(err);
    }
};

export const markRead = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await Notification.updateOne(
            { _id: req.params.id, user: req.user._id },
            { $set: { readAt: new Date() } }
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error("markRead error:", err?.message);
        return next(err);
    }
};

export const markAllRead = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        await Notification.updateMany(
            { user: req.user._id, readAt: null },
            { $set: { readAt: new Date() } }
        );
        return res.json({ ok: true });
    } catch (err) {
        console.error("markAllRead error:", err?.message);
        return next(err);
    }
};
