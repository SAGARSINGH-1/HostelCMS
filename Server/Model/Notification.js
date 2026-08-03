import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "userModel", // 👈 dynamic
        },
        userModel: {
            type: String,
            enum: ["Student", "Faculty"],
            required: true,
        },

        type: {
            type: String,
            enum: ["mention", "status-change", "assign"],
            required: true,
        },

        queryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentQuery",
            required: true,
        },

        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "triggeredByModel", // 👈 dynamic
        },
        triggeredByModel: {
            type: String,
            enum: ["Student", "Faculty"],
            required: true,
        },

        payload: { type: Object, default: {} },

        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);
