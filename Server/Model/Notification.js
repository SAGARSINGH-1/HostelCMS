// Model/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, required: true }, // recipient id (student or faculty)
        type: { type: String, enum: ["mention", "status-change"], required: true },
        queryId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentQuery", required: true },
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, required: true }, // actor id
        payload: { type: Object, default: {} },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);
