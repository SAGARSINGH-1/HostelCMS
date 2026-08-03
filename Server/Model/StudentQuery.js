import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
    {
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        role: {
            type: String,
            enum: ["student", "faculty", "admin"],
            default: "faculty",
        },
        from: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            required: true,
        },
        to: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            required: true,
        },
        note: { type: String, default: "", trim: true },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
            name: { type: String, default: "", trim: true },
        },
    },
    { _id: false }
);

const mentionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "mentions.userModel",
        },
        userModel: {
            type: String,
            required: true,
            enum: ["Student", "Faculty"],
        },
    },
    { _id: false }
);

const documentSchema = new mongoose.Schema(
    {
        fileName: { type: String, default: "", trim: true },
        fileType: { type: String, default: "", trim: true },
        size: { type: Number, default: 0 },
        gridId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "uploads.files",
            default: null,
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
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },

        documents: {
            type: [documentSchema],
            default: [],
        },

        status: {
            type: String,
            enum: ["pending", "in-progress", "resolved"],
            default: "pending",
            index: true,
        },

        response: {
            type: String,
            default: "",
            trim: true,
        },

        tags: {
            type: [String],
            enum: [
                "water",
                "mess",
                "internet",
                "washroom",
                "electricity",
                "maintenance",
                "other",
            ],
            default: ["other"],
            index: true,
        },

        scope: {
            type: String,
            enum: ["room", "floor", "block", "hostel", "campus"],
            default: "room",
            required: true,
            index: true,
        },

        campus: {
            type: String,
            default: "main-campus",
            trim: true,
            lowercase: true,
            index: true,
        },

        hostel: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
            index: true,
        },

        block: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },

        floor: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },

        roomNumber: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },

        scopeKey: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
            index: true,
        },

        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },

        mentions: {
            type: [mentionSchema],
            default: [],
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Faculty",
            default: null,
            index: true,
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
            index: true,
        },

        priorityScore: {
            type: Number,
            default: 0,
            min: 0,
        },

        duplicateOf: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentQuery",
            default: null,
            index: true,
        },

        supportCount: {
            type: Number,
            default: 1,
            min: 1,
        },

        affectedStudents: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Student",
                },
            ],
            default: [],
        },

        isMerged: {
            type: Boolean,
            default: false,
            index: true,
        },

        votes: {
            upvotes: {
                type: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Student",
                    },
                ],
                default: [],
            },
            downvotes: {
                type: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Student",
                    },
                ],
                default: [],
            },
        },
    },
    { timestamps: true }
);

studentQuerySchema.pre("validate", function (next) {
    const normalize = (value = "") => String(value || "").trim().toLowerCase();

    this.campus = normalize(this.campus || "main-campus");
    this.hostel = normalize(this.hostel);
    this.block = normalize(this.block);
    this.floor = normalize(this.floor);
    this.roomNumber = normalize(this.roomNumber);

    const campus = this.campus;
    const hostel = this.hostel;
    const block = this.block;
    const floor = this.floor;
    const roomNumber = this.roomNumber;

    switch (this.scope) {
        case "room":
            this.scopeKey = [campus, hostel, block, floor, roomNumber]
                .filter(Boolean)
                .join(":");
            break;

        case "floor":
            this.scopeKey = [campus, hostel, block, floor]
                .filter(Boolean)
                .join(":");
            break;

        case "block":
            this.scopeKey = [campus, hostel, block]
                .filter(Boolean)
                .join(":");
            break;

        case "hostel":
            this.scopeKey = [campus, hostel]
                .filter(Boolean)
                .join(":");
            break;

        case "campus":
            this.scopeKey = [campus].filter(Boolean).join(":");
            break;

        default:
            this.scopeKey = [campus, hostel].filter(Boolean).join(":");
            break;
    }

    next();
});

studentQuerySchema.pre("save", function (next) {
    if (!this.votes) {
        this.votes = { upvotes: [], downvotes: [] };
    }

    if (!Array.isArray(this.affectedStudents)) {
        this.affectedStudents = [];
    }

    if (this.isNew && this.student) {
        const exists = this.affectedStudents.some(
            (id) => String(id) === String(this.student)
        );

        if (!exists) {
            this.affectedStudents.push(this.student);
        }
    }

    if (!this.supportCount || this.supportCount < 1) {
        this.supportCount = Math.max(1, this.affectedStudents.length || 1);
    }

    this.priorityScore = Math.max(
        this.priorityScore || 0,
        this.supportCount || 1
    );

    next();
});

studentQuerySchema.index({ status: 1, tags: 1, createdAt: -1 });
studentQuerySchema.index({ duplicateOf: 1, status: 1 });
studentQuerySchema.index({ assignedTo: 1, status: 1 });
studentQuerySchema.index({ scope: 1, scopeKey: 1, status: 1, createdAt: -1 });
studentQuerySchema.index({ campus: 1, hostel: 1, scope: 1, status: 1 });
studentQuerySchema.index({ supportCount: -1, priority: 1, status: 1 });

delete mongoose.models.StudentQuery;
export default mongoose.model("StudentQuery", studentQuerySchema);