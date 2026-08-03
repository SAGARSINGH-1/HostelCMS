import Student from "../Model/Student.js";
import Faculty from "../Model/Faculty.js";

// Matches @username tokens: 3–30 chars
const MENTION_RE = /@([a-z0-9_.]{3,30})/g;

export async function extractMentions(text = "") {
    if (!text) return { mentions: [], usernames: [] };

    const usernames = new Set();
    let match;

    // Step 1: extract unique usernames
    while ((match = MENTION_RE.exec(text)) !== null) {
        usernames.add(match[1].toLowerCase());
    }

    if (!usernames.size) {
        return { mentions: [], usernames: [] };
    }

    const list = Array.from(usernames);

    // Step 2: fetch users from both collections
    const [students, faculties] = await Promise.all([
        Student.find({ username: { $in: list } })
            .select("_id username name")
            .collation({ locale: "en", strength: 2 }),

        Faculty.find({ username: { $in: list } })
            .select("_id username name")
            .collation({ locale: "en", strength: 2 }),
    ]);

    // Step 3: map username → user info
    const byUsername = new Map();

    for (const s of students) {
        byUsername.set(s.username.toLowerCase(), {
            userId: s._id,
            role: "student",
            model: "Student", // 🔥 needed for refPath
            username: s.username,
            name: s.name,
        });
    }

    for (const f of faculties) {
        byUsername.set(f.username.toLowerCase(), {
            userId: f._id,
            role: "faculty",
            model: "Faculty", // 🔥 needed for refPath
            username: f.username,
            name: f.name,
        });
    }

    // Step 4: rebuild mentions with positions
    const mentions = [];
    const seen = new Set(); // prevent duplicate notifications

    MENTION_RE.lastIndex = 0;

    while ((match = MENTION_RE.exec(text)) !== null) {
        const uname = match[1].toLowerCase();
        const hit = byUsername.get(uname);

        if (hit) {
            const key = String(hit.userId);

            // avoid duplicate mention entries (optional but recommended)
            if (seen.has(key)) continue;
            seen.add(key);

            mentions.push({
                userId: hit.userId,
                role: hit.role,
                userModel: hit.model, // 🔥 IMPORTANT for notifications
                username: hit.username,
                name: hit.name,

                start: match.index,
                end: match.index + match[0].length,
            });
        }
    }

    return { mentions, usernames: list };
}