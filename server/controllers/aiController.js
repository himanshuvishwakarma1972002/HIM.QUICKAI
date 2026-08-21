import "dotenv/config";
import sql from "../configs/db.js";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { extractResumeText } from "../utils/resumeText.js";
import { clerkClient } from "@clerk/express";
import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";
import { createChatCompletion } from "../utils/geminiClient.js";
import { routeUserIntent } from "../services/aiRouterService.js";
import { searchMovies } from "../services/movieSearchService.js";
import { searchYouTube } from "../services/youtubeSearchService.js";
import { searchWeb } from "../services/webSearchService.js";
import { summarizeSearchResults } from "../services/searchSummaryService.js";
import { isExplicitVideoRequest, isExplicitImageRequest } from "../utils/intentHeuristics.js";



const IMAGE_MODEL = (process.env.GEMINI_IMAGE_MODEL || "gemini-3-flash-preview").replace(/"/g, "").trim();
const VIDEO_MODEL = (process.env.GEMINI_VIDEO_MODEL || "veo-3.1-fast-generate-preview").replace(/"/g, "").trim();

const geminiApiKey = (process.env.GEMINI_API_KEY || "")
  .replace(/^["']|["']$/g, "")
  .trim();

const AI = new OpenAI({
    apiKey: geminiApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});

const genAI = new GoogleGenAI({
  apiKey: geminiApiKey,
});

const VIDEO_QUOTA_COOLDOWN_MS = 30 * 60 * 1000;
let videoQuotaBlockedUntil = 0;

const isVideoQuotaBlocked = () => Date.now() < videoQuotaBlockedUntil;

const markVideoQuotaBlocked = () => {
  videoQuotaBlockedUntil = Date.now() + VIDEO_QUOTA_COOLDOWN_MS;
  console.warn(
    `VIDEO QUOTA BLOCKED until ${new Date(videoQuotaBlockedUntil).toISOString()}`
  );
};

const buildResumeFallbackReview = (resumeText) => {
  const text = (resumeText || "").toLowerCase();
  const sections = {
    summary: /summary|profile|objective/.test(text),
    skills: /skills|tech stack|technologies/.test(text),
    experience: /experience|employment|work history/.test(text),
    projects: /project/.test(text),
    education: /education|university|college|school/.test(text),
  };

  const missing = Object.entries(sections)
    .filter(([, present]) => !present)
    .map(([name]) => name);

  return [
    "AI review service is temporarily unavailable, so this is a fallback resume review.",
    "",
    "Strengths:",
    "- Resume file was parsed successfully.",
    `- Detected sections: ${Object.entries(sections).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}.`,
    "",
    "Improvements:",
    `- Add missing sections: ${missing.length ? missing.join(", ") : "none"}.`,
    "- Add measurable impact in experience/project bullets (numbers, percentages, outcomes).",
    "- Keep each bullet action-oriented and concise.",
    "- Tailor skills and keywords to the target job description."
  ].join("\n");
};

// ================== ARTICLE ==================
export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan === 'premium' && free_usage >= 10) {
      return res.json({ success: false, message: "You have reached your free usage limit. Upgrade to a premium plan to continue using the AI generator." });
      
    }
    const response = await createChatCompletion([{
              role: "user",
              content: prompt,
          },
      ], length);

  const content = response.choices[0].message.content;

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')`;

      if(plan === 'premium'){
        await clerkClient.users.updateUserMetadata(userId, {
          privateMetadata: {
            free_usage: free_usage + 1
          }
        })
      }

    res.json({ success: true, content });

  } catch (error) {
    console.log(error.message)
    res.json({success: false, message: error.message})
}
}
  

// ================== BLOG TITLE ==================
export const generateBlogTitle = async (req, res) => {
  try {
    // ✅ FIX: auth()
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // ✅ validation
    if (!prompt || prompt.trim() === "") {
      return res.json({
        success: false,
        message: "Prompt is required",
      });
    }

    // ✅ FIX: correct usage logic
    if (plan === 'free' && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Free limit reached. Upgrade to premium."
      });
    }

    // ✅ BETTER PROMPT (VERY IMPORTANT)
    const aiPrompt = `Generate exactly 5 catchy, SEO-friendly blog titles for the topic: "${prompt}".

Rules:
- Each title on a new line
- No numbering
- No explanation
- Keep them short and engaging`;

    // ✅ USE YOUR FALLBACK FUNCTION
    const response = await createChatCompletion(
      [{ role: "user", content: aiPrompt }],
      500
    );

    let content = response?.choices?.[0]?.message?.content || "";

    // ✅ CLEAN OUTPUT
    const titles = content
      .split("\n")
      .map(t => t.replace(/^\d+[\).\-\s]*/, "").trim())
      .filter(t => t.length > 0);

    const finalContent = titles.join("\n");

    // ✅ SAVE TO DATABASE
    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${finalContent}, 'blog-title')
    `;

    // ✅ UPDATE USAGE
    if (plan === 'free') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    // ✅ RESPONSE (better for frontend)
    res.json({
      success: true,
      titles,       // array (BEST)
      content: finalContent // fallback (string)
    });

  } catch (error) {
    console.log("BLOG TITLE ERROR:", error.message);

    res.json({
      success: false,
      message: error.message || "Failed to generate blog titles",
    });
  }
};
// ================== IMAGE ==================

export const generateImage = async (req, res) => {
  try {
    // ✅ AUTH (important)
    const { userId } = req.auth();

    const { prompt, publish } = req.body;

    // ✅ VALIDATION
    if (!prompt || prompt.trim() === "") {
      return res.json({
        success: false,
        message: "Prompt is required",
      });
    }

    // ✅ CREATE FORM DATA
    const formData = new FormData();
    formData.append("prompt", prompt);

    // ✅ CALL CLIPDROP API
    const response = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...formData.getHeaders(), // 🔥 IMPORTANT
        },
        responseType: "arraybuffer",
      }
    );

    // ✅ CONVERT TO BASE64
    const base64 = Buffer.from(response.data).toString("base64");

    // ✅ UPLOAD TO CLOUDINARY
    const upload = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64}`,
      {
        folder: "ai_images",
      }
    );

    const imageUrl = upload.secure_url;

    // ✅ SAVE TO DATABASE
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${imageUrl}, 'image', ${publish ?? false})
    `;

    // ✅ RESPONSE
    res.json({
      success: true,
      content: imageUrl,
    });

  } catch (error) {
    console.log("IMAGE ERROR:", error.response?.data || error.message);

    res.json({
      success: false,
      message: error.response?.data?.error || "Image generation failed",
    });
  }
};

// ================== REMOVE BG ==================


export const removeImageBackground = async (req, res) => {
  try {
    // ✅ AUTH
    const { userId } = req.auth();

    const plan = req.plan;

    // ✅ CHECK FILE
    if (!req.file) {
      return res.json({
        success: false,
        message: "No image uploaded",
      });
    }

    // ✅ PREMIUM CHECK
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    // ✅ UPLOAD + REMOVE BG
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "ai_bg_removed",
      transformation: [{ effect: "background_removal" }],
    });

    const imageUrl = result.secure_url;

    // ✅ DELETE TEMP FILE
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // ✅ SAVE TO DATABASE
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, 'Background removed image', ${imageUrl}, 'image', false)
    `;

    // ✅ RESPONSE
    res.json({
      success: true,
      content: imageUrl,
    });

  } catch (error) {
    console.log("REMOVE BG ERROR:", error.message);

    res.json({
      success: false,
      message: error.message || "Background removal failed",
    });
  }
};

// ================== REMOVE OBJECT ==================


export const removeImageObject = async (req, res) => {
  try {
    // ✅ AUTH
    const { userId } = req.auth();

    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    // ✅ VALIDATION
    if (!image) {
      return res.json({ success: false, message: "No image uploaded" });
    }

    if (!object || object.trim() === "") {
      return res.json({ success: false, message: "Object is required" });
    }

    // ✅ PREMIUM CHECK
    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    // ✅ UPLOAD IMAGE FIRST
    const upload = await cloudinary.uploader.upload(image.path);

    // ✅ CLEAN OBJECT NAME
    const normalizedObject = object
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    // ✅ REMOVE OBJECT
    const imageUrl = cloudinary.url(upload.public_id, {
      resource_type: "image",
      secure: true,
      transformation: [{ effect: `gen_remove:prompt_${normalizedObject}` }],
    });

    // ✅ DELETE TEMP FILE
    if (fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    // ✅ SAVE TO DB
    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image', false)
    `;

    res.json({ success: true, content: imageUrl });

  } catch (error) {
    console.log("REMOVE OBJECT ERROR:", error.message);

    res.json({
      success: false,
      message: error.message || "Object removal failed",
    });
  }
};

// ================== RESUME STUDIO ==================
const formatAtsReport = (data) => {
  const lines = [
    `# ATS Compatibility Report`,
    ``,
    `## Overall ATS Score: **${data.score}/100**`,
    ``,
    data.summary || "",
    ``,
    `## Matched Keywords`,
    ...(data.matchedKeywords?.length
      ? data.matchedKeywords.map((k) => `- ${k}`)
      : ["- None detected"]),
    ``,
    `## Missing Keywords`,
    ...(data.missingKeywords?.length
      ? data.missingKeywords.map((k) => `- ${k}`)
      : ["- None"]),
    ``,
    `## Formatting Issues`,
    ...(data.formattingIssues?.length
      ? data.formattingIssues.map((k) => `- ${k}`)
      : ["- No major issues detected"]),
    ``,
    `## Strengths`,
    ...(data.strengths?.length
      ? data.strengths.map((k) => `- ${k}`)
      : ["- Resume parsed successfully"]),
    ``,
    `## Recommended Improvements`,
    ...(data.improvements?.length
      ? data.improvements.map((k) => `- ${k}`)
      : ["- Tailor keywords to the job description"]),
  ];
  return lines.join("\n");
};

const buildAtsFallback = (resumeText, jobDescription) => {
  const resume = (resumeText || "").toLowerCase();
  const job = (jobDescription || "").toLowerCase();
  const words = [...new Set(job.match(/[a-z][a-z0-9+#.]{2,}/g) || [])];
  const matched = words.filter((w) => resume.includes(w)).slice(0, 12);
  const missing = words.filter((w) => !resume.includes(w)).slice(0, 12);
  const score = Math.min(
    95,
    Math.round((matched.length / Math.max(words.length, 1)) * 100)
  );

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
    formattingIssues: [
      "AI service unavailable — limited heuristic check only",
    ],
    strengths: ["Resume file parsed successfully"],
    improvements: [
      "Add missing job keywords naturally in skills and experience",
      "Use standard section headings (Experience, Education, Skills)",
      "Keep formatting simple — avoid tables and graphics for ATS",
    ],
    summary:
      "Fallback ATS scan completed. Connect AI service for a full analysis.",
  };
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth();
    const mode = req.body.mode || "review";
    const companyName = (req.body.companyName || "").trim();
    const jobTitle = (req.body.jobTitle || "").trim();
    const jobDescription = (req.body.jobDescription || "").trim();
    const profileInfo = (req.body.profileInfo || "").trim();

    let resumeText = "";

    if (req.file) {
      console.log("FILE RECEIVED:", req.file.originalname);
      resumeText = await extractResumeText(
        req.file.buffer,
        req.file.originalname
      );

      if (!resumeText?.trim()) {
        return res.json({
          success: false,
          message: "Could not read text from this file. Try another format.",
        });
      }
    }

    if (mode === "review" && !resumeText) {
      return res.json({
        success: false,
        message: "Please upload a resume file",
      });
    }

    if (mode === "ats") {
      if (!resumeText) {
        return res.json({
          success: false,
          message: "Please upload a resume for ATS checking",
        });
      }
      if (!jobDescription) {
        return res.json({
          success: false,
          message: "Please paste the job description",
        });
      }
    }

    if (mode === "tailor") {
      if (!jobDescription) {
        return res.json({
          success: false,
          message: "Please paste the job description",
        });
      }
      if (!companyName && !jobTitle) {
        return res.json({
          success: false,
          message: "Please enter the company name or job title",
        });
      }
      if (!resumeText && !profileInfo) {
        return res.json({
          success: false,
          message:
            "Upload an existing resume or fill in your background details",
        });
      }
    }

    let content = "";
    let atsScore = null;
    let creationType = "resume-review";
    let promptLabel = "Resume Review";

    try {
      if (mode === "review") {
        const response = await createChatCompletion(
          [
            {
              role: "user",
              content: `You are an expert career coach. Review this resume and provide constructive feedback.

Cover:
1. Overall impression
2. Strengths
3. Weaknesses
4. Section-by-section improvements
5. Actionable next steps

Resume:
${resumeText}`,
            },
          ],
          1200
        );
        content = response?.choices?.[0]?.message?.content || "No response";
        promptLabel = "Resume Review";
      } else if (mode === "ats") {
        creationType = "resume-ats";
        promptLabel = `ATS Check — ${companyName || jobTitle || "Role"}`;

        const response = await createChatCompletion(
          [
            {
              role: "user",
              content: `You are an ATS (Applicant Tracking System) expert. Analyze this resume against the job description.

Company: ${companyName || "Not specified"}
Role: ${jobTitle || "Not specified"}

Job Description:
${jobDescription}

Resume:
${resumeText}

Respond ONLY with valid JSON (no markdown fences) in this exact shape:
{
  "score": <number 0-100>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "formattingIssues": ["issue1"],
  "strengths": ["strength1"],
  "improvements": ["improvement1"],
  "summary": "2-3 sentence overview"
}`,
            },
          ],
          1500
        );

        const raw = response?.choices?.[0]?.message?.content || "";
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : buildAtsFallback(resumeText, jobDescription);

        atsScore = parsed.score ?? 0;
        content = formatAtsReport(parsed);
      } else if (mode === "tailor") {
        creationType = "resume-tailor";
        promptLabel = `Tailored Resume — ${companyName}${jobTitle ? ` · ${jobTitle}` : ""}`;

        const sourceBlock = resumeText
          ? `Existing resume to improve and tailor:\n${resumeText}`
          : `Candidate background (use this to build the resume):\n${profileInfo}`;

        const response = await createChatCompletion(
          [
            {
              role: "user",
              content: `You are an expert resume writer. Create a professional, ATS-optimized resume tailored for a specific role.

Target Company: ${companyName || "Not specified"}
Target Position: ${jobTitle || "Not specified"}

Job Description:
${jobDescription}

${sourceBlock}

Requirements:
- Output in clean Markdown
- Sections: Contact Info (use placeholders if unknown), Professional Summary, Core Skills, Professional Experience, Projects (if relevant), Education
- Mirror keywords from the job description naturally
- Use strong action verbs and quantified achievements where possible
- Keep it concise (1-2 pages worth of content)
- Optimize for ATS parsing`,
            },
          ],
          2000
        );

        content = response?.choices?.[0]?.message?.content || "No response";
      }
    } catch (aiError) {
      console.log("AI ERROR:", aiError?.message);

      if (mode === "review") {
        content = buildResumeFallbackReview(resumeText);
      } else if (mode === "ats") {
        const fallback = buildAtsFallback(resumeText, jobDescription);
        atsScore = fallback.score;
        content = formatAtsReport(fallback);
      } else {
        content = [
          "# Tailored Resume (Fallback)",
          "",
          "AI service is temporarily unavailable. Please try again shortly.",
          "",
          "## Target Role",
          `**${jobTitle || "Role"}** at **${companyName || "Company"}**`,
          "",
          "## Job Description Summary",
          jobDescription.slice(0, 500) + (jobDescription.length > 500 ? "..." : ""),
        ].join("\n");
      }
    }

    await sql`
      INSERT INTO creations (user_id, prompt, content, type)
      VALUES (${userId}, ${promptLabel}, ${content}, ${creationType})
    `;

    res.json({
      success: true,
      content,
      mode,
      atsScore,
    });
  } catch (error) {
    console.log("RESUME ERROR:", error);

    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "File too large (max 5MB)"
        : error.message || "Resume processing failed";

    res.json({
      success: false,
      message,
    });
  }
};
// ================== CHAT (GPT PAGE) ==================
const parseChatMessages = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const detectMediaIntent = (text = "", forcedMode = "auto") => {
  const mode = (forcedMode || "auto").toLowerCase();
  if (mode === "image" || mode === "video" || mode === "chat") return mode;

  const t = text.toLowerCase();

  if (
    /\b(generate|create|make|render|produce|animate)\b.{0,40}\b(video|clip|reel|animation|mp4)\b/.test(t) ||
    /\b(video|clip|reel|animation)\b.{0,40}\b(generate|create|make|of|about|showing)\b/.test(t) ||
    /\b(text[\s-]?to[\s-]?video)\b/.test(t)
  ) {
    return "video";
  }

  if (
    /\b(generate|create|make|draw|design|paint|imagine|render)\b.{0,40}\b(image|picture|photo|illustration|artwork|logo|poster|thumbnail)\b/.test(t) ||
    /\b(image|picture|photo|illustration|logo)\b.{0,40}\b(of|about|showing|with)\b/.test(t) ||
    /\b(text[\s-]?to[\s-]?image)\b/.test(t)
  ) {
    return "image";
  }

  return "chat";
};

const extractGenerationPrompt = (text = "") => {
  return text
    .replace(
      /^(please\s+)?(can you\s+)?(generate|create|make|draw|design|paint|imagine|render|produce|animate)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|artwork|logo|poster|thumbnail|video|clip|reel|animation)\s*(of|about|showing|with|:)?\s*/i,
      ""
    )
    .trim() || text.trim();
};

const buildChatFileContext = async (files = []) => {
  const textParts = [];
  const imageParts = [];

  for (const file of files) {
    const name = file.originalname || "file";
    const mime = file.mimetype || "";

    if (mime.startsWith("image/")) {
      const base64 = file.buffer.toString("base64");
      imageParts.push({
        type: "image_url",
        image_url: {
          url: `data:${mime};base64,${base64}`,
        },
      });
      textParts.push(`[Attached image: ${name}]`);
      continue;
    }

    try {
      const extracted = await extractResumeText(file.buffer, name);
      textParts.push(
        `\n--- File: ${name} ---\n${extracted.trim() || "(No extractable text)"}\n---`
      );
    } catch (err) {
      textParts.push(
        `\n--- File: ${name} ---\n(Could not extract text: ${err.message})\n---`
      );
    }
  }

  return { textParts, imageParts };
};

const uploadBase64Image = async (base64, folder = "chat_images") => {
  const upload = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64}`,
    { folder }
  );
  return upload.secure_url;
};

const generateChatImage = async (prompt, userId) => {
  try {
    const image = await AI.images.generate({
      model: IMAGE_MODEL,
      prompt,
      response_format: "b64_json",
      n: 1,
    });

    const b64 = image?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data from Gemini");

    const imageUrl = await uploadBase64Image(b64);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${imageUrl}, 'image', false)
    `;

    return imageUrl;
  } catch (geminiErr) {
    console.log("GEMINI IMAGE FALLBACK:", geminiErr?.message);

    // Fallback to Clipdrop (existing pipeline)
    const formData = new FormData();
    formData.append("prompt", prompt);

    const response = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API_KEY,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64 = Buffer.from(response.data).toString("base64");
    const imageUrl = await uploadBase64Image(base64);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${imageUrl}, 'image', false)
    `;

    return imageUrl;
  }
};

const formatAiError = (error) => {
  const raw =
    error?.error?.message ||
    error?.message ||
    error?.response?.data?.error?.message ||
    (typeof error === "string" ? error : "") ||
    "AI request failed";

  let parsed = null;
  try {
    parsed = typeof raw === "string" && raw.trim().startsWith("{")
      ? JSON.parse(raw)
      : null;
  } catch {
    const match = String(raw).match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        parsed = null;
      }
    }
  }

  const code =
    parsed?.error?.code ||
    error?.status ||
    error?.response?.status ||
    (typeof error?.code === "number" ? error.code : null);
  const msg = parsed?.error?.message || String(raw);
  const blob = `${msg} ${raw}`;

  if (
    code === 429 ||
    /RESOURCE_EXHAUSTED|exceeded your current quota|rate.?limit/i.test(blob)
  ) {
    return {
      code: 429,
      message:
        "Gemini API quota exceeded for this feature. Please wait a bit, check billing at ai.google.dev, or try Image / Chat mode instead.",
    };
  }

  // 401 = bad/missing key on the host (very common on Render when env is wrong)
  if (
    code === 401 ||
    /UNAUTHENTICATED|invalid.?api.?key|API[_ ]?key not valid|incorrect api key/i.test(
      blob
    )
  ) {
    return {
      code: 401,
      message:
        "Gemini API key was rejected (401). On Render → Environment, set GEMINI_API_KEY to a valid key from AI Studio (no quotes), then redeploy.",
    };
  }

  if (
    code === 403 ||
    /PERMISSION_DENIED|not enabled|FAILED_PRECONDITION/i.test(blob)
  ) {
    const isVeo = /veo|video|generateVideos/i.test(blob);
    return {
      code: 403,
      message: isVeo
        ? "AI video generation is not available on this Gemini API key. Use Chat or Image mode instead."
        : "This Gemini model is not available for the current API key. On Render set GEMINI_MODEL=gemini-flash-lite-latest (and GEMINI_IMAGE_MODEL=gemini-3-flash-preview), then redeploy.",
    };
  }

  // Keep user-facing text short — strip nested JSON blobs
  const clean = msg.replace(/\{[\s\S]*\}/g, "").trim();
  return {
    code: code || 500,
    message: clean || "Generation failed. Please try again.",
  };
};

const generateChatVideo = async (prompt, userId) => {
  let operation;
  try {
    operation = await genAI.models.generateVideos({
      model: VIDEO_MODEL,
      prompt,
    });
  } catch (err) {
    throw Object.assign(new Error(formatAiError(err).message), {
      status: formatAiError(err).code,
    });
  }

  const maxPolls = 36; // ~5 min at 8s
  let polls = 0;

  while (!operation.done && polls < maxPolls) {
    await new Promise((resolve) => setTimeout(resolve, 8000));
    try {
      operation = await genAI.operations.getVideosOperation({ operation });
    } catch (err) {
      throw Object.assign(new Error(formatAiError(err).message), {
        status: formatAiError(err).code,
      });
    }
    polls += 1;
  }

  if (!operation.done) {
    throw new Error("Video generation timed out. Please try a shorter prompt.");
  }

  const generated = operation.response?.generatedVideos?.[0];
  const videoMeta = generated?.video;

  if (!videoMeta) {
    throw new Error(
      "No video returned from Veo. Your API key may not have video access yet."
    );
  }

  let videoUrl;

  if (videoMeta.uri) {
    const downloadUrl = videoMeta.uri.includes("?")
      ? `${videoMeta.uri}&key=${geminiApiKey}`
      : `${videoMeta.uri}?key=${geminiApiKey}`;

    const videoRes = await axios.get(downloadUrl, {
      responseType: "arraybuffer",
      timeout: 120000,
    });

    const upload = await cloudinary.uploader.upload(
      `data:video/mp4;base64,${Buffer.from(videoRes.data).toString("base64")}`,
      {
        folder: "chat_videos",
        resource_type: "video",
      }
    );
    videoUrl = upload.secure_url;
  } else if (videoMeta.videoBytes) {
    const upload = await cloudinary.uploader.upload(
      `data:video/mp4;base64,${videoMeta.videoBytes}`,
      {
        folder: "chat_videos",
        resource_type: "video",
      }
    );
    videoUrl = upload.secure_url;
  } else {
    throw new Error("Video file could not be downloaded");
  }

  await sql`
    INSERT INTO creations (user_id, prompt, content, type, publish)
    VALUES (${userId}, ${prompt}, ${videoUrl}, 'video', false)
  `;

  return videoUrl;
};

const executeSearchIntents = async (searchIntents, userQuery, language) => {
  const movieResults = [];
  const youtubeResults = [];
  const webResults = [];
  const errors = [];

  await Promise.all(
    searchIntents.map(async (item) => {
      if (item.intent === "movie_search") {
        const result = await searchMovies(item.query || userQuery, item.language || language);
        if (result.success) movieResults.push(...result.results);
        else if (result.message) errors.push(result.message);
      } else if (item.intent === "youtube_search") {
        const result = await searchYouTube(item.query || userQuery);
        if (result.success) youtubeResults.push(...result.results);
        else if (result.message) errors.push(result.message);
      } else if (item.intent === "web_search") {
        const result = await searchWeb(item.query || userQuery);
        if (result.success) webResults.push(...result.results);
        else if (result.message) errors.push(result.message);
      }
    })
  );

  // Auto-fetch YouTube trailers when movies are found but no YouTube results yet
  if (
    movieResults.length &&
    !youtubeResults.length &&
    searchIntents.some((i) => i.intent === "movie_search")
  ) {
    const trailerQuery = `${userQuery.replace(/\bmoview\b/gi, "movie")} official trailer`;
    const trailerResult = await searchYouTube(trailerQuery);
    if (trailerResult.success && trailerResult.results?.length) {
      youtubeResults.push(...trailerResult.results);
    }
  }

  const totalFound = movieResults.length + youtubeResults.length + webResults.length;

  if (!totalFound && errors.length) {
    return {
      success: false,
      type: "search",
      message: errors[0],
    };
  }

  const answer = await summarizeSearchResults({
    userQuery,
    language,
    movies: movieResults,
    youtube: youtubeResults,
    web: webResults,
  });

  const searchTypes = [...new Set(searchIntents.map((i) => i.intent))];
  const hasMovies = movieResults.length > 0;
  const hasYoutube = youtubeResults.length > 0;
  const hasWeb = webResults.length > 0;
  const typeCount = [hasMovies, hasYoutube, hasWeb].filter(Boolean).length;
  const isCombined = typeCount > 1;

  let searchType = "web";
  if (isCombined) searchType = "combined";
  else if (hasMovies) searchType = "movies";
  else if (hasYoutube) searchType = "youtube";

  const response = {
    success: true,
    type: "search",
    searchType,
    query: userQuery,
    content: answer,
    answer,
    mediaType: "text",
  };

  if (isCombined) {
    response.movieResults = movieResults;
    response.youtubeResults = youtubeResults;
    response.webResults = webResults;
  } else if (searchType === "movies") {
    response.results = movieResults;
  } else if (searchType === "youtube") {
    response.results = youtubeResults;
  } else {
    response.results = webResults;
  }

  return response;
};

const buildYouTubeVideoFallback = async (query, userQuery, language, reason) => {
  const searchQuery = query.trim() || userQuery.trim();
  if (!searchQuery) return null;

  const ytResult = await searchYouTube(searchQuery);
  if (!ytResult.success || !ytResult.results?.length) return null;

  // Prefer a fast local blurb; AI summary is best-effort with a short timeout.
  const top = ytResult.results.slice(0, 5);
  const list = top
    .map((v, i) => `${i + 1}. **${v.title}** — ${v.channel || "YouTube"}`)
    .join("\n");

  let summary = list;
  try {
    summary = await Promise.race([
      summarizeSearchResults({
        userQuery: userQuery || searchQuery,
        language,
        youtube: ytResult.results,
      }),
      new Promise((resolve) => setTimeout(() => resolve(list), 4000)),
    ]);
  } catch {
    summary = list;
  }

  const reasonNote =
    reason?.includes("quota") || reason?.includes("429")
      ? "AI video generation quota is exceeded"
      : "AI video generation is unavailable";

  return {
    success: true,
    type: "search",
    searchType: "youtube",
    query: userQuery || searchQuery,
    content: `**${reasonNote}** — here are related videos you can watch on YouTube:\n\n${summary}`,
    answer: summary,
    results: ytResult.results,
    mediaType: "text",
    warning: reason,
  };
};

export const chatWithAI = async (req, res) => {
  try {
    const { userId } = req.auth();
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const messages = parseChatMessages(req.body?.messages);
    const files = Array.isArray(req.files) ? req.files : [];
    const rawMode = Array.isArray(req.body?.mode) ? req.body.mode[0] : req.body?.mode;
    const forcedMode = String(rawMode || "auto").toLowerCase();

    if (!messages.length && !files.length) {
      return res.json({
        success: false,
        message: "Messages or files are required",
      });
    }

    const lastUserText =
      [...messages].reverse().find((m) => m?.role === "user")?.content || "";

    const routedIntents = await routeUserIntent({
      userText: lastUserText,
      hasFiles: files.length > 0,
      forcedMode,
    });

    const hasSearchIntent = routedIntents.some((i) =>
      ["web_search", "movie_search", "youtube_search"].includes(i.intent)
    );
    const imageIntent =
      routedIntents.find((i) => i.intent === "image_generation") &&
      isExplicitImageRequest(lastUserText, forcedMode)
        ? routedIntents.find((i) => i.intent === "image_generation")
        : null;
    const videoIntent =
      routedIntents.find((i) => i.intent === "video_generation") &&
      isExplicitVideoRequest(lastUserText, forcedMode)
        ? routedIntents.find((i) => i.intent === "video_generation")
        : null;
    const language = routedIntents[0]?.language || "en";

    console.log("CHAT INTENT:", {
      forcedMode,
      routed: routedIntents.map((i) => i.intent),
      image: Boolean(imageIntent),
      video: Boolean(videoIntent),
      search: hasSearchIntent,
    });

    const generationPrompt = extractGenerationPrompt(
      imageIntent?.query || videoIntent?.query || lastUserText
    );

    // ===== SEARCH (web / movies / YouTube) =====
    if (hasSearchIntent && !imageIntent && !videoIntent) {
      const searchIntents = routedIntents.filter((i) =>
        ["web_search", "movie_search", "youtube_search"].includes(i.intent)
      );
      const searchResponse = await executeSearchIntents(
        searchIntents,
        lastUserText,
        language
      );
      return res.json(searchResponse);
    }

    // ===== IMAGE GENERATION =====
    if (imageIntent && forcedMode !== "search") {
      if (!generationPrompt) {
        return res.json({
          success: false,
          message: "Please describe the image you want to generate",
        });
      }

      try {
        const imageUrl = await generateChatImage(generationPrompt, userId);

        return res.json({
          success: true,
          content: `Here's the image I generated for: **${generationPrompt}**`,
          mediaType: "image",
          mediaUrl: imageUrl,
        });
      } catch (imageError) {
        const formatted = formatAiError(imageError);
        console.log("IMAGE ERROR:", formatted.message);
        return res.json({
          success: false,
          message: formatted.message,
        });
      }
    }

    // ===== VIDEO GENERATION =====
    if (videoIntent && forcedMode !== "search") {
      if (isVideoQuotaBlocked()) {
        const ytFallback = await buildYouTubeVideoFallback(
          generationPrompt,
          lastUserText,
          language,
          "AI video generation quota is temporarily exceeded"
        );
        if (ytFallback) {
          return res.json({
            ...ytFallback,
            videoQuotaExceeded: true,
            switchToMode: "auto",
          });
        }
        return res.json({
          success: false,
          message:
            "AI video generation quota is exceeded right now. Please wait and try again, or switch to Image / Chat mode.",
          videoQuotaExceeded: true,
          switchToMode: "auto",
        });
      }

      if (!generationPrompt) {
        return res.json({
          success: false,
          message: "Please describe the video you want to generate",
        });
      }

      try {
        const videoUrl = await generateChatVideo(generationPrompt, userId);

        return res.json({
          success: true,
          content: `Here's the video I generated for: **${generationPrompt}**\n\n_Note: Video generation can take up to a couple of minutes._`,
          mediaType: "video",
          mediaUrl: videoUrl,
        });
      } catch (videoError) {
        const formatted = formatAiError(videoError);
        console.log("VIDEO ERROR:", formatted.message);

        if (formatted.code === 429) {
          markVideoQuotaBlocked();
        }

        const ytFallback = await buildYouTubeVideoFallback(
          generationPrompt,
          lastUserText,
          language,
          formatted.message
        );
        if (ytFallback) {
          return res.json({
            ...ytFallback,
            videoQuotaExceeded: formatted.code === 429,
            switchToMode: formatted.code === 429 ? "auto" : undefined,
          });
        }

        // Do NOT fall through to chat — that produces fake tool-call JSON text
        return res.json({
          success: false,
          message: formatted.message,
          videoQuotaExceeded: formatted.code === 429,
          ...(formatted.code === 429 ? { switchToMode: "auto" } : {}),
        });
      }
    }

    // ===== NORMAL CHAT =====
    const { textParts, imageParts } = await buildChatFileContext(files);
    const history = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : String(m.content || ""),
      }));

    if (history.length && (textParts.length || imageParts.length)) {
      const last = history[history.length - 1];
      if (last.role === "user") {
        const combinedText = [last.content, ...textParts]
          .filter(Boolean)
          .join("\n\n")
          .trim();

        if (imageParts.length) {
          last.content = [
            { type: "text", text: combinedText || "Please analyze the attached file(s)." },
            ...imageParts,
          ];
        } else {
          last.content = combinedText || "Please analyze the attached file(s).";
        }
      }
    } else if (!history.length && (textParts.length || imageParts.length)) {
      const combinedText = textParts.join("\n\n").trim();
      history.push({
        role: "user",
        content: imageParts.length
          ? [
              {
                type: "text",
                text: combinedText || "Please analyze the attached file(s).",
              },
              ...imageParts,
            ]
          : combinedText || "Please analyze the attached file(s).",
      });
    }

    const systemPrompt = {
      role: "system",
      content: `You are Him.AI — a multimodal assistant like Gemini.
- Answer clearly with markdown when helpful
- When files are attached, use their content
- Image and video generation are handled by the system — never invent tool calls, JSON actions, or fake media URLs
- Never output formats like {"action":"..."} or dalle/tool JSON
- Be concise, accurate, and helpful
- Do not claim you generated a video or image unless a real media file was created`,
    };

    const finalMessages = [systemPrompt, ...history];
    const response = await createChatCompletion(finalMessages, 1500);

    let content =
      response?.choices?.[0]?.message?.content || "No response";

    // Reject hallucinated tool-call / action JSON (seen when video/image path fails)
    if (
      /"action"\s*:/.test(content) ||
      /dalle\.|text2im|generateVideos|action_input/i.test(content)
    ) {
      content =
        "I couldn't run that media tool from chat. Please use **Video** or **Image** mode and try again.";
    }

    content = content
      .replace(/```(\w+)/g, "\n```$1\n")
      .replace(/```/g, "\n```")
      .replace(/\n{3,}/g, "\n\n");

    // Do not attach videoQuotaExceeded here — that flag is video-only and was
    // incorrectly surfacing as "quota exceeded" on normal chat replies.
    res.json({
      success: true,
      content,
      mediaType: "text",
    });
    } catch (error) {
      const formatted = formatAiError(error);
      console.log("CHAT ERROR:", formatted.message);

      res.json({
        success: false,
        message:
          formatted.code === 401
            ? formatted.message
            : formatted.code === 403
              ? "Chat model is unavailable on this server API key. On Render set GEMINI_MODEL=gemini-flash-lite-latest and confirm GEMINI_API_KEY, then redeploy."
              : formatted.message,
      });
    }
};