import "dotenv/config";
import sql from "../configs/db.js";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { extractResumeText } from "../utils/resumeText.js";
import { clerkClient } from "@clerk/express";
import OpenAI from "openai";



const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
});
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-3-flash-preview").replace(/"/g, "").trim();
const FALLBACK_MODELS = [...new Set([
  GEMINI_MODEL,
  "gemini-2.0-flash",
  "gemini-1.5-flash-002",
  "gemini-1.5-pro",
])];

const createChatCompletion = async (messages, maxTokens) => {
  let lastError;
  for (const model of FALLBACK_MODELS) {
    try {
      return await AI.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
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