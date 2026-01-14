import express from "express";
import { getBucket } from "../lib/gridfs.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.get("/files/:id", async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const bucket = getBucket();

        // Optionally fetch file doc to set content-type/filename
        const files = await bucket.find({ _id: id }).toArray();
        if (!files.length) return res.status(404).json({ message: "File not found" });

        const file = files[0];
        if (file.contentType) res.set("Content-Type", file.contentType);
        res.set("Content-Disposition", `inline; filename="${file.filename}"`);

        bucket.openDownloadStream(id).pipe(res).on("error", () => {
            res.status(500).json({ message: "Stream error" });
        });
    } catch (e) {
        res.status(400).json({ message: "Invalid file id" });
    }
});

router.delete("/files/:id", async (req, res) => {
    try {
        const id = new ObjectId(req.params.id);
        const bucket = getBucket();
        await bucket.delete(id);
        res.json({ message: "Deleted" });
    } catch (e) {
        res.status(400).json({ message: "Invalid file id" });
    }
});

export default router;
