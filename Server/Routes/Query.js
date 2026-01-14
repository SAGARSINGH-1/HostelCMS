import express from "express";
import { protect } from "../Middleware/authMiddleware.js";
import uploadMemory from "../Middleware/upload-memory.js";

import {
    createQuery,
    getStudentQueries,
    updateQuery,
    deleteQuery,
    getTopLatestQueries,
    getQueryById,
    getQueryStats,
    updateQueryStatusFaculty,
} from "../Controller/Query.js";

const router = express.Router();

/**
 * Create query with optional file uploads (multipart/form-data)
 * Order: protect -> uploadMemory -> controller
 * Only authenticated students or faculty can create.
 */
router.post(
    "/queries",
    protect(["student", "faculty"]),
    uploadMemory.array("documents", 5),
    createQuery
);

// Get queries, optionally by studentId
router.get("/queries/student/:id", getStudentQueries);
router.get("/queries", getTopLatestQueries);

// Update and delete (generic)
router.put("/queries/:id", updateQuery);
router.delete("/queries/:id", deleteQuery);

// Stats and details
router.get("/queries/stats", getQueryStats);
router.get("/queries/:id", getQueryById);

// Faculty-only status update
router.put("/queries/:id/status", protect(["faculty"]), updateQueryStatusFaculty);

export default router;
