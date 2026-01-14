import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import Faculty from "./Routes/Faculty.js";
import Student from "./Routes/Student.js";
import Query from "./Routes/Query.js";
import Auth from "./Routes/Auth.js";
import FileRoutes from "./Routes/File.js";
import usernamesRouter from "./Routes/Usernames.js";
import notificationsRouter from "./Routes/Notification.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json()); // must be before routes for JSON endpoints
app.use("/api", FileRoutes);

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error(err));

app.use("/api/faculty", Faculty);
app.use("/api/student", Student);
app.use("/api/query", Query);
app.use("/api/auth", Auth);
app.use("/api/usernames", usernamesRouter);
app.use("/api/notifications", notificationsRouter);
app.use((req, res) => res.status(404).send("Not found"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));