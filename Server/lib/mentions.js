// lib/mentions.js
import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";

// Matches @username tokens: 3–30 chars, lowercase letters, digits, _ or .
const MENTION_RE = /@([a-z0-9_.]{3,30})/g;

export async function extractMentions(text = "") {
    const usernames = new Set();
    let m;
    while ((m = MENTION_RE.exec(text)) !== null) {
        usernames.add(m[1].toLowerCase());
    }
    if (!usernames.size) return { mentions: [], usernames: [] };

    const list = Array.from(usernames);

    // Resolve across both collections; case-insensitive collation
    const [students, faculties] = await Promise.all([
        Student.find({ username: { $in: list } })
            .select("_id username")
            .collation({ locale: "en", strength: 2 }),
        Faculty.find({ username: { $in: list } })
            .select("_id username")
            .collation({ locale: "en", strength: 2 }),
    ]);

    const byUsername = new Map();
    for (const s of students) byUsername.set(s.username.toLowerCase(), { userId: s._id, role: "student", username: s.username });
    for (const f of faculties) byUsername.set(f.username.toLowerCase(), { userId: f._id, role: "faculty", username: f.username });

    // Build mentions with offsets for highlighting
    const mentions = [];
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(text)) !== null) {
        const uname = m[1].toLowerCase();
        const hit = byUsername.get(uname);
        if (hit) {
            mentions.push({
                userId: hit.userId,
                role: hit.role,
                username: hit.username,
                start: m.index,
                end: m.index + m[0].length,
            });
        }
    }
    return { mentions, usernames: list };
}
