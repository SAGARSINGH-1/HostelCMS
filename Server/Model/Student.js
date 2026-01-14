import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // display name [web:14]
        username: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true, // store canonical form for stable tagging [web:14]
            trim: true,
            match: [/^[a-z0-9_\.]{3,30}$/, "Invalid username"], // tags like @user_name [web:14]
        },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        hostel: String,
        roomNo: String,
        year: { type: Number },
        phone: { type: String },
        role: { type: String, default: "student" },
    },
    { timestamps: true }
);

// Optional: enforce case-insensitive uniqueness at index level
studentSchema.index({ username: 1 }, { unique: true, collation: { locale: "en", strength: 2 } }); // case-insensitive [web:12][web:17]

export default mongoose.model("Student", studentSchema);
