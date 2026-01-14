import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";

// Helpers
const normalizeUsername = (u = "") => u.trim().toLowerCase();
const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

// 🔹 Student Signup
export const studentSignup = async (req, res) => {
    try {
        const { name, email, password, hostel, roomNo, username } = req.body;

        const uname = normalizeUsername(username);
        if (!USERNAME_REGEX.test(uname)) {
            return res.status(400).json({ message: "Invalid username format" });
        }

        // Pre-check to give fast feedback (not sufficient to guarantee uniqueness)
        const existing = await Student.findOne({
            $or: [{ email }, { username: uname }],
        }).collation({ locale: "en", strength: 2 }); // match CI index [web:12]
        if (existing) {
            const isEmail = existing.email.toLowerCase() === (email || "").toLowerCase();
            return res
                .status(400)
                .json({ message: isEmail ? "Email already in use" : "Username already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newStudent = new Student({
            name,
            email,
            username: uname,
            password: hashedPassword,
            hostel,
            roomNo,
        });

        try {
            await newStudent.save();
        } catch (err) {
            // Handle race-condition duplicate index violations
            if (err && err.code === 11000) {
                const keys = Object.keys(err.keyPattern || {});
                if (keys.includes("email")) {
                    return res.status(400).json({ message: "Email already in use" });
                }
                if (keys.includes("username")) {
                    return res.status(400).json({ message: "Username already in use" });
                }
                return res.status(400).json({ message: "Duplicate key" });
            }
            throw err;
        }

        const token = jwt.sign(
            { id: newStudent._id, role: "student", username: newStudent.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "Student registered successfully",
            student: newStudent,
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔹 Faculty Signup
export const facultySignup = async (req, res) => {
    try {
        const { name, email, password, department, designation, phone, username } = req.body;

        const uname = normalizeUsername(username);
        if (!USERNAME_REGEX.test(uname)) {
            return res.status(400).json({ message: "Invalid username format" });
        }

        const existing = await Faculty.findOne({
            $or: [{ email }, { username: uname }],
        }).collation({ locale: "en", strength: 2 }); // CI match [web:12]
        if (existing) {
            const isEmail = existing.email.toLowerCase() === (email || "").toLowerCase();
            return res
                .status(400)
                .json({ message: isEmail ? "Email already in use" : "Username already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newFaculty = new Faculty({
            name,
            email,
            username: uname,
            password: hashedPassword,
            department,
            designation,
            phone,
        });

        try {
            await newFaculty.save();
        } catch (err) {
            if (err && err.code === 11000) {
                const keys = Object.keys(err.keyPattern || {});
                if (keys.includes("email")) {
                    return res.status(400).json({ message: "Email already in use" });
                }
                if (keys.includes("username")) {
                    return res.status(400).json({ message: "Username already in use" });
                }
                return res.status(400).json({ message: "Duplicate key" });
            }
            throw err;
        }

        const token = jwt.sign(
            { id: newFaculty._id, role: "faculty", username: newFaculty.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "Faculty registered successfully",
            faculty: newFaculty,
            token,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔹 Student Login (email or username)
export const studentLogin = async (req, res) => {
    try {
        const { identifier, password } = req.body; // can be email or username
        const byEmail = identifier && identifier.includes("@");
        const query = byEmail
            ? { email: identifier }
            : { username: normalizeUsername(identifier) };

        const student = await Student.findOne(query).collation({ locale: "en", strength: 2 }); // CI queries [web:12]
        if (!student) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, student.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: student._id, role: "student", username: student.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token, student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 🔹 Faculty Login (email or username)
export const facultyLogin = async (req, res) => {
    try {
        const { identifier, password } = req.body; // can be email or username
        const byEmail = identifier && identifier.includes("@");
        const query = byEmail
            ? { email: identifier }
            : { username: normalizeUsername(identifier) };

        const faculty = await Faculty.findOne(query).collation({ locale: "en", strength: 2 }); // CI queries [web:12]
        if (!faculty) return res.status(400).json({ message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, faculty.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            { id: faculty._id, role: "faculty", username: faculty.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token, faculty });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
