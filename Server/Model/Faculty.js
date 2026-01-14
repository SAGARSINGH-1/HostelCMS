import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // display name [web:14]
        username: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true,         // canonical form for tagging [web:14]
            trim: true,
            match: [/^[a-z0-9_\.]{3,30}$/, "Invalid username"], // for @mentions [web:14]
        },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        department: { type: String, required: true },
        designation: { type: String, required: true },
        phone: String,
        role: { type: String, default: "faculty" },
    },
    { timestamps: true }
);

// Case-insensitive unique username
facultySchema.index(
    { username: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } } // CI unique [web:12][web:17]
);

export default mongoose.model("Faculty", facultySchema);
