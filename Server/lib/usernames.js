// lib/usernames.js
import mongoose from "mongoose";
import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";

export async function getUsernameById(userId) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  const id = new mongoose.Types.ObjectId(userId);
  const s = await Student.findById(id).select("username name").lean();
  if (s) return { id, role: "student", username: s.username || null, name: s.name || null };
  const f = await Faculty.findById(id).select("username name").lean();
  if (f) return { id, role: "faculty", username: f.username || null, name: f.name || null };
  return null;
}

export async function getUsernamesByIds(ids = []) {
  const validIds = ids.filter((x) => mongoose.Types.ObjectId.isValid(x)).map((x) => new mongoose.Types.ObjectId(x));
  if (!validIds.length) return {};
  const [students, faculties] = await Promise.all([
    Student.find({ _id: { $in: validIds } }).select("_id username name").lean(),
    Faculty.find({ _id: { $in: validIds } }).select("_id username name").lean(),
  ]);
  const map = {};
  for (const s of students) map[String(s._id)] = { id: s._id, role: "student", username: s.username || null, name: s.name || null };
  for (const f of faculties) map[String(f._id)] = { id: f._id, role: "faculty", username: f.username || null, name: f.name || null };
  return map;
}
