import express from "express";
import {
    // getStudentDetails,
    // editStudentDetails,
    // deleteStudentAccount,
} from "../Controller/Student.js";

const router = express.Router();

// Student CRUD
// router.get("/", getStudentDetails);         // Get all students
// router.put("/editStudent/:id", editStudentDetails);     // Update student by ID
// router.delete("/deleteStudent/:id", deleteStudentAccount);// Delete student by ID

export default router;
