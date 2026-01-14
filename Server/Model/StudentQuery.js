import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
    {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        role: { type: String, enum: ["student", "faculty", "admin"], default: "faculty" },
        from: { type: String, enum: ["pending", "in-progress", "resolved"], required: true },
        to: { type: String, enum: ["pending", "in-progress", "resolved"], required: true },
        note: { type: String, default: "" },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            name: { type: String },
        },
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
                gridId: { type: mongoose.Schema.Types.ObjectId, ref: "uploads.files" }, // GridFS file id
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
            enum: ["water", "mess", "internet", "washroom", "electricity", "maintenance"],
            default: ["other"],
        },

        // New: status history with default empty note
        statusHistory: {
            type: [statusHistorySchema],
            default: [], // empty array by default
        },
    },
    { timestamps: true }
);

export default mongoose.models.StudentQuery ||
    mongoose.model("StudentQuery", studentQuerySchema);
