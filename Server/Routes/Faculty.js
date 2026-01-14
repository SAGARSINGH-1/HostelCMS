import express from "express"
import { getFacultyDetails, editFacultyDetails, deleteFacultyAccount } from "../Controller/Faculty.js"

const router = express.Router();

// Routes
router.get("/", getFacultyDetails);          // GET all faculty
router.put("/:id", editFacultyDetails);      // UPDATE faculty by ID
router.delete("/:id", deleteFacultyAccount); // DELETE faculty by ID

export default router;
