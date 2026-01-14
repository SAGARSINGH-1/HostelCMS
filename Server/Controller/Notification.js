// Controller/Notification.js
import Notification from "../Model/Notification.js";

export const listMyNotifications = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        // Optional: narrow fields for lighter payloads
        const items = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

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
