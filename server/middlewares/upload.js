import multer from "multer";
import { extname } from "path";
import { isAllowedResumeFile } from "../utils/resumeText.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedResumeFile(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, and TXT files are allowed"));
    }
  },
});

const isAllowedChatFile = (file) => {
  const ext = extname(file.originalname || "").toLowerCase();
  const type = file.mimetype || "";

  if (type.startsWith("image/")) return true;
  if (isAllowedResumeFile(file.originalname)) return true;
  return [".pdf", ".doc", ".docx", ".txt"].includes(ext);
};

export const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    if (isAllowedChatFile(file)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, DOCX, TXT, and images are allowed"));
    }
  },
});

export default upload;
