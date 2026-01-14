import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";

let bucket = null;

export function getBucket() {
    if (!bucket) {
        const db = mongoose.connection.db;
        bucket = new GridFSBucket(db, { bucketName: "uploads" }); // creates uploads.files and uploads.chunks
    }
    return bucket;
}

export function toObjectId(id) {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
}
