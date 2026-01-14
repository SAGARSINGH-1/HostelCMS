import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
    {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, default: null }, // from req.user._id
        role: { type: String, enum: ["student", "faculty", "admin"], default: "faculty" },
        from: { type: String, enum: ["pending", "in-progress", "resolved"], required: true },
        to: { type: String, enum: ["pending", "in-progress", "resolved"], required: true },
        note: { type: String, default: "" },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId }, // do not ref "User" since you have Student/Faculty
            name: { type: String },
        },
    },
    { _id: false }
);

// Mentions subdocument: resolved at save time from @username tokens
const mentionSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        role: { type: String, enum: ["student", "faculty"], required: true },
        username: { type: String, required: true }, // canonical, lowercase
        start: { type: Number }, // optional UI offsets
        end: { type: Number },
    },
    { _id: false }
);

const studentQuerySchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String, required: true },
        documents: [
            {
                fileName: String,
                fileType: String,
                size: Number,
                gridId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" },
            },
        ],
        status: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            default: "pending",
        },
        response: { type: String, default: "" },

        // Tags for categorization
        tags: {
            type: [String],
            enum: ["water", "mess", "internet", "washroom", "electricity", "maintenance", "other"],
            default: ["other"],
        },

        // New: resolved mentions for tagging/notifications
        mentions: {
            type: [mentionSchema],
            default: [],
        },

        // Status history
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
    },
    { timestamps: true }
);

// Optional indexes for dashboards/filters
studentQuerySchema.index({ createdAt: -1 });
studentQuerySchema.index({ status: 1 });
studentQuerySchema.index({ "mentions.userId": 1 });

export default mongoose.model("StudentQuery", studentQuerySchema);
