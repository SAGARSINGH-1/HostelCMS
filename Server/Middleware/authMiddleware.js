import jwt from "jsonwebtoken";

export const protect = (roles = []) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(" ")[1];
            if (!token) return res.status(401).json({ message: "No token, not authorized" });

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden: wrong role" });
            }
            req.user = decoded; // { id, role }
            return next();
        } catch (err) {
            res.status(401).json({ message: "Invalid/Expired token" });
        }
    };
};
