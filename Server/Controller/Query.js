import mongoose from "mongoose";
import Faculty from "../Model/Faculty.js";
import StudentQuery from "../Model/StudentQuery.js";
import Notification from "../Model/Notification.js"; // NEW
import { getBucket } from "../lib/gridfs.js";
import { Readable } from "stream";
import { extractMentions } from "../lib/mentions.js";
import { getPriority } from "../utils/priorityEngine.js";


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
        const normalizeTags = (tags) => {
            if (!tags) return ["other"];
            const arr = Array.isArray(tags) ? tags : [tags];
            return arr.map((t) => String(t).toLowerCase().trim()).filter(Boolean);
        };

        const escapeRegex = (text = "") =>
            text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        const normalizeText = (text = "") =>
            String(text)
                .toLowerCase()
                .replace(/[^\w\s]/g, " ")
                .replace(/\s+/g, " ")
                .trim();

        const normalizeValue = (value = "") =>
            String(value || "").trim().toLowerCase();

        const buildSearchRegex = (title = "") => {
            const words = normalizeText(title)
                .split(" ")
                .filter((w) => w.length > 2)
                .slice(0, 5);

            if (!words.length) return null;
            return new RegExp(words.map(escapeRegex).join("|"), "i");
        };

        const inferScope = ({
            scope,
            tags,
            title,
            description,
            hostel,
            block,
            floor,
            roomNumber,
        }) => {
            if (scope && ["room", "floor", "block", "hostel", "campus"].includes(scope)) {
                return scope;
            }

            const allText = `${title} ${description}`.toLowerCase();
            const normalizedTags = Array.isArray(tags) ? tags : [tags];

            if (
                allText.includes("whole university") ||
                allText.includes("entire university") ||
                allText.includes("campus") ||
                allText.includes("portal down") ||
                allText.includes("university wifi") ||
                allText.includes("college wifi")
            ) {
                return "campus";
            }

            if (normalizedTags.includes("mess")) {
                return "hostel";
            }

            if (normalizedTags.includes("internet")) {
                if (roomNumber) return "room";
                if (floor) return "floor";
                if (block) return "block";
                if (hostel) return "hostel";
                return "campus";
            }

            if (
                normalizedTags.some((tag) =>
                    ["water", "washroom", "electricity", "maintenance"].includes(tag)
                )
            ) {
                if (roomNumber) return "room";
                if (floor) return "floor";
                if (block) return "block";
                if (hostel) return "hostel";
            }

            return hostel ? "hostel" : "campus";
        };

        const buildScopeKey = ({ scope, campus, hostel, block, floor, roomNumber }) => {
            const safeCampus = normalizeValue(campus || "main-campus");
            const safeHostel = normalizeValue(hostel);
            const safeBlock = normalizeValue(block);
            const safeFloor = normalizeValue(floor);
            const safeRoom = normalizeValue(roomNumber);

            switch (scope) {
                case "room":
                    return [safeCampus, safeHostel, safeBlock, safeFloor, safeRoom]
                        .filter(Boolean)
                        .join(":");
                case "floor":
                    return [safeCampus, safeHostel, safeBlock, safeFloor]
                        .filter(Boolean)
                        .join(":");
                case "block":
                    return [safeCampus, safeHostel, safeBlock]
                        .filter(Boolean)
                        .join(":");
                case "hostel":
                    return [safeCampus, safeHostel]
                        .filter(Boolean)
                        .join(":");
                case "campus":
                    return [safeCampus].filter(Boolean).join(":");
                default:
                    return [safeCampus, safeHostel].filter(Boolean).join(":");
            }
        };

        const {
            student,
            title,
            description,
            tags,
            scope,
            campus,
            hostel,
            block,
            floor,
            roomNumber,
        } = req.body;

        if (!student || !mongoose.Types.ObjectId.isValid(student)) {
            return res.status(400).json({ message: "student missing/invalid" });
        }

        if (!title || !description) {
            return res.status(400).json({ message: "title and description required" });
        }

        const normalizedTags = normalizeTags(tags);
        const normalizedCampus = normalizeValue(campus || "main-campus");
        const normalizedHostel = normalizeValue(hostel);
        const normalizedBlock = normalizeValue(block);
        const normalizedFloor = normalizeValue(floor);
        const normalizedRoomNumber = normalizeValue(roomNumber);

        const resolvedScope = inferScope({
            scope,
            tags: normalizedTags,
            title,
            description,
            hostel: normalizedHostel,
            block: normalizedBlock,
            floor: normalizedFloor,
            roomNumber: normalizedRoomNumber,
        });

        const resolvedScopeKey = buildScopeKey({
            scope: resolvedScope,
            campus: normalizedCampus,
            hostel: normalizedHostel,
            block: normalizedBlock,
            floor: normalizedFloor,
            roomNumber: normalizedRoomNumber,
        });

        const { mentions } = await extractMentions(description);

        const bucket = getBucket();
        const documents = [];
        const uploadFiles = req.files || [];

        for (const f of uploadFiles) {
            const readStream = Readable.from(f.buffer);
            const uploadStream = bucket.openUploadStream(f.originalname, {
                contentType: f.mimetype,
                metadata: { uploadedAt: new Date() },
            });

            await new Promise((resolve, reject) => {
                readStream.pipe(uploadStream).on("error", reject).on("finish", resolve);
            });

            documents.push({
                fileName: f.originalname,
                fileType: f.mimetype,
                gridId: uploadStream.id,
                size: f.size,
            });
        }

        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        const textRegex = buildSearchRegex(title);

        const duplicateQuery = {
            status: { $in: ["pending", "in-progress"] },
            duplicateOf: null,
            scope: resolvedScope,
            scopeKey: resolvedScopeKey,
            tags: { $in: normalizedTags },
        };

        if (textRegex) {
            duplicateQuery.$or = [
                { title: { $regex: textRegex } },
                { description: { $regex: textRegex } },
            ];
        }

        let existingQuery = await StudentQuery.findOne(duplicateQuery).sort({ createdAt: -1 });

        if (existingQuery) {
            const alreadyAffected = (existingQuery.affectedStudents || []).some(
                (id) => String(id) === String(student)
            );

            if (!alreadyAffected) {
                existingQuery.affectedStudents.addToSet(student);
            }

            existingQuery.supportCount = Math.max(
                existingQuery.affectedStudents.length || 1,
                (existingQuery.supportCount || 1) + (alreadyAffected ? 0 : 1)
            );

            const recalculatedPriority = getPriority(
                existingQuery.title,
                `${existingQuery.description} ${description}`,
                existingQuery.supportCount,
                existingQuery.scope
            );

            if (priorityOrder[recalculatedPriority] > priorityOrder[existingQuery.priority]) {
                existingQuery.priority = recalculatedPriority;
            }

            existingQuery.priorityScore = existingQuery.supportCount;

            if (documents.length) {
                existingQuery.documents.push(...documents);
            }

            const existingMentions = new Set(
                (existingQuery.mentions || []).map((m) => `${String(m.user)}:${m.userModel}`)
            );

            for (const m of mentions) {
                const key = `${String(m.userId)}:${m.userModel}`;
                if (!existingMentions.has(key)) {
                    existingQuery.mentions.push({
                        user: m.userId,
                        userModel: m.userModel,
                    });
                    existingMentions.add(key);
                }
            }

            existingQuery.statusHistory.push({
                from: existingQuery.status,
                to: existingQuery.status,
                note: `Duplicate complaint joined by student ${student}. Scope: ${resolvedScope}. Support count increased to ${existingQuery.supportCount}.`,
                at: new Date(),
                by: req.user?._id || student,
                role: req.user?.role || "student",
                updatedBy: {
                    id: req.user?._id || student,
                    name: req.user?.name || req.user?.username || "Student",
                },
            });

            await existingQuery.save();

            if (existingQuery.assignedTo) {
                await Notification.create({
                    user: existingQuery.assignedTo,
                    userModel: "Faculty",
                    type: "query-update",
                    queryId: existingQuery._id,
                    triggeredBy: req.user?._id || student,
                    triggeredByModel: req.user?.role === "faculty" ? "Faculty" : "Student",
                    payload: {
                        title: existingQuery.title,
                        snippet: "A similar complaint increased this query's support count.",
                        supportCount: existingQuery.supportCount,
                        priority: existingQuery.priority,
                        scope: existingQuery.scope,
                        scopeKey: existingQuery.scopeKey,
                    },
                }).catch(() => { });
            }

            return res.status(200).json({
                message: "Similar complaint found. Existing complaint updated.",
                isDuplicate: true,
                joinedQuery: existingQuery,
            });
        }

        const priority = getPriority(
            title,
            description,
            1,
            resolvedScope
        );

        const newQuery = await StudentQuery.create({
            student,
            title: String(title).trim(),
            description: String(description).trim(),
            documents,
            status: "pending",
            tags: normalizedTags,
            scope: resolvedScope,
            campus: normalizedCampus,
            hostel: normalizedHostel,
            block: normalizedBlock,
            floor: normalizedFloor,
            roomNumber: normalizedRoomNumber,
            scopeKey: resolvedScopeKey,
            priority,
            priorityScore: 1,
            supportCount: 1,
            affectedStudents: [student],
            duplicateOf: null,
            mentions: mentions.map((m) => ({
                user: m.userId,
                userModel: m.userModel,
            })),
        });

        await routeQuery(newQuery._id);

        if (mentions.length) {
            const actorId = req.user?._id || student;
            const actorModel = req.user?.role === "faculty" ? "Faculty" : "Student";

            const uniq = new Map();
            for (const m of mentions) {
                const key = String(m.userId);
                if (!uniq.has(key)) uniq.set(key, m);
            }

            const notifications = Array.from(uniq.values()).map((m) => ({
                user: m.userId,
                userModel: m.userModel,
                type: "mention",
                queryId: newQuery._id,
                triggeredBy: actorId,
                triggeredByModel: actorModel,
                payload: {
                    title,
                    snippet: description.slice(0, 140),
                    username: m.username,
                    role: m.role,
                },
            }));

            await Notification.insertMany(notifications, { ordered: false }).catch(() => { });
        }

        return res.status(201).json({
            message: "Query created successfully",
            isDuplicate: false,
            query: newQuery,
        });
    } catch (error) {
        console.error("createQuery error:", error);
        return res.status(500).json({
            message: "Error creating query",
            error: error.message,
        });
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
            .populate("assignedTo", "name username department")
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


export const routeQuery = async (queryId) => {
    try {
        const normalize = (value = "") => String(value || "").trim().toLowerCase();

        const query = await StudentQuery.findById(queryId);
        if (!query) throw new Error("Query not found");

        const tags = (query.tags || []).map((t) => normalize(t));
        const scope = normalize(query.scope || "room");
        const campus = normalize(query.campus || "main-campus");
        const hostel = normalize(query.hostel || "");
        const block = normalize(query.block || "");
        const floor = normalize(query.floor || "");

        const scopeWeightMap = {
            room: 1,
            floor: 2,
            block: 3,
            hostel: 4,
            campus: 5,
        };

        const queryScopeWeight = scopeWeightMap[scope] || 1;

        const allFaculty = await Faculty.find({
            isActive: { $ne: false },
        });

        if (!allFaculty.length) return null;

        const scoredFaculty = allFaculty.map((faculty) => {
            const facultyCategories = (faculty.categories || []).map((c) => normalize(c));
            const facultyScopes = (faculty.scopes || []).map((s) => normalize(s));
            const facultyCampuses = (faculty.campuses || []).map((c) => normalize(c));
            const facultyHostels = (faculty.hostels || []).map((h) => normalize(h));
            const facultyBlocks = (faculty.blocks || []).map((b) => normalize(b));
            const facultyFloors = (faculty.floors || []).map((f) => normalize(f));

            let score = 0;

            const matchedTags = tags.filter((tag) => facultyCategories.includes(tag));
            score += matchedTags.length * 5;

            if (facultyScopes.includes(scope)) {
                score += 5;
            } else {
                const facultyScopeWeights = facultyScopes.map((s) => scopeWeightMap[s] || 0);
                const canHandleHigherScope = facultyScopeWeights.some((w) => w >= queryScopeWeight);
                if (canHandleHigherScope) score += 2;
            }

            if (campus && facultyCampuses.length && facultyCampuses.includes(campus)) {
                score += 2;
            }

            if (hostel && facultyHostels.length && facultyHostels.includes(hostel)) {
                score += 4;
            }

            if (block && facultyBlocks.length && facultyBlocks.includes(block)) {
                score += 2;
            }

            if (floor && facultyFloors.length && facultyFloors.includes(floor)) {
                score += 1;
            }

            if (faculty.role === "admin") {
                score += 1;
            }

            return {
                faculty,
                score,
            };
        });

        let matchedFaculty = scoredFaculty
            .filter((item) => item.score > 0)
            .sort((a, b) => b.score - a.score);

        if (!matchedFaculty.length) {
            matchedFaculty = scoredFaculty;
        }

        const candidateFacultyIds = matchedFaculty.map((item) => item.faculty._id);

        const loads = await StudentQuery.aggregate([
            {
                $match: {
                    assignedTo: { $in: candidateFacultyIds },
                    status: { $ne: "resolved" },
                },
            },
            {
                $group: {
                    _id: "$assignedTo",
                    count: { $sum: 1 },
                    weightedLoad: {
                        $sum: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$priority", "urgent"] }, then: 5 },
                                    { case: { $eq: ["$priority", "high"] }, then: 3 },
                                    { case: { $eq: ["$priority", "medium"] }, then: 2 },
                                    { case: { $eq: ["$priority", "low"] }, then: 1 },
                                ],
                                default: 1,
                            },
                        },
                    },
                },
            },
        ]);

        const loadMap = {};
        loads.forEach((item) => {
            loadMap[String(item._id)] = {
                count: item.count || 0,
                weightedLoad: item.weightedLoad || 0,
            };
        });

        let selectedFaculty = null;
        let bestScore = -Infinity;

        for (const item of matchedFaculty) {
            const facultyId = String(item.faculty._id);
            const loadInfo = loadMap[facultyId] || { count: 0, weightedLoad: 0 };

            const finalScore =
                item.score * 10 -
                loadInfo.weightedLoad * 2 -
                loadInfo.count;

            if (finalScore > bestScore) {
                bestScore = finalScore;
                selectedFaculty = item.faculty;
            }
        }

        if (!selectedFaculty) return null;

        query.assignedTo = selectedFaculty._id;

        query.statusHistory = query.statusHistory || [];
        query.statusHistory.push({
            from: query.status,
            to: query.status,
            note: "Auto-routed to faculty based on category, scope, location match, and current load.",
            at: new Date(),
            by: selectedFaculty._id,
            role: selectedFaculty.role === "admin" ? "admin" : "faculty",
            updatedBy: {
                id: selectedFaculty._id,
                name: selectedFaculty.name || selectedFaculty.username || "Faculty",
            },
        });

        await query.save();

        return selectedFaculty;
    } catch (error) {
        console.error("Routing error:", error);
        return null;
    }
};



// Voting in query
// Voting in query - ATOMIC VERSION
export const voteQuery = async (req, res) => {
    try {
        const { type } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!["upvote", "downvote"].includes(type)) {
            return res.status(400).json({ message: "Invalid vote type" });
        }

        const query = await StudentQuery.findById(req.params.id);
        if (!query) {
            return res.status(404).json({ message: "Query not found" });
        }

        if (!query.votes) {
            query.votes = { upvotes: [], downvotes: [] };
        }

        query.votes.upvotes.pull(userId);
        query.votes.downvotes.pull(userId);

        if (type === "upvote") {
            query.votes.upvotes.addToSet(userId);
        } else {
            query.votes.downvotes.addToSet(userId);
        }

        const upvoteCount = query.votes.upvotes.length;
        query.priority = getPriority(query.title, query.description, upvoteCount);
        query.priorityScore = upvoteCount;

        await query.save();

        return res.status(200).json({
            upvotes: query.votes.upvotes.length,
            downvotes: query.votes.downvotes.length,
            priority: query.priority,
            priorityScore: query.priorityScore,
        });
    } catch (err) {
        console.error("❌ ERROR:", err);
        return res.status(500).json({ message: err.message });
    }
};
// To View all voetes done by the users 
export const viewVotes = async (req, res) => {
    try {
        // Dot notation populate for nested arrays
        const query = await StudentQuery.findById(req.params.id)
            .populate({ path: "votes.upvotes", select: "name" })
            .populate({ path: "votes.downvotes", select: "name" });

        if (!query) return res.status(404).json({ message: "Query not found" });
        res.json({ votes: query.votes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};