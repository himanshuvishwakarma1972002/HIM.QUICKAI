import { mkdtemp, writeFile, unlink, rm } from "fs/promises";
import { tmpdir } from "os";
import { join, extname } from "path";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";
import { PDFParse } from "pdf-parse";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx", ".txt"]);

export const isAllowedResumeFile = (originalname = "") => {
  const ext = extname(originalname).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
};

const extractPdfText = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const data = await parser.getText();
    return data.text || "";
  } finally {
    await parser.destroy();
  }
};

const extractDocxText = async (buffer) => {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
};

const extractDocText = async (buffer) => {
  const dir = await mkdtemp(join(tmpdir(), "resume-"));
  const path = join(dir, "resume.doc");
  try {
    await writeFile(path, buffer);
    const doc = await new WordExtractor().extract(path);
    return doc.getBody() || "";
  } finally {
    await unlink(path).catch(() => {});
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
};

const extractTxtText = (buffer) => buffer.toString("utf-8");

export const extractResumeText = async (buffer, originalname = "") => {
  const ext = extname(originalname).toLowerCase();

  switch (ext) {
    case ".pdf":
      return extractPdfText(buffer);
    case ".docx":
      return extractDocxText(buffer);
    case ".doc":
      return extractDocText(buffer);
    case ".txt":
      return extractTxtText(buffer);
    default:
      throw new Error("Unsupported file type. Use PDF, DOC, DOCX, or TXT.");
  }
};
