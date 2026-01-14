import multer from "multer";

const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { files: 5, fileSize: 20 * 1024 * 1024 }, // adjust as needed
});

export default uploadMemory;
