import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3, fields: 14, parts: 20 },
  fileFilter(_req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      const error = new Error("Upload a JPG, PNG, or WEBP image.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  }
});

export async function validateImages(files, { minimum = 1, maximum = 1 } = {}) {
  if (!Array.isArray(files) || files.length < minimum || files.length > maximum) {
    const error = new Error(`Upload between ${minimum} and ${maximum} images.`);
    error.status = 400;
    throw error;
  }
  for (const file of files) {
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (file.size > 5 * 1024 * 1024 || !detectedType || !allowedImageTypes.has(detectedType.mime) || detectedType.mime !== file.mimetype) {
      const error = new Error("Each image must be JPG, PNG, or WEBP and no larger than 5 MB.");
      error.status = 400;
      throw error;
    }
    file.mimetype = detectedType.mime;
  }
}

export function imageExtension(mimetype) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mimetype];
}
