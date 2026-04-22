import "dotenv/config";
import sql from "../configs/db.js";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { PDFParse } from "pdf-parse";
import { clerkClient } from "@clerk/express";
import OpenAI from "openai";



const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai"
});
const GEMINI_MODEL = (process.env.GEMINI_MODEL || "gemini-1.5-flash-002").replace(/"/g, "").trim();
const FALLBACK_MODELS = [...new Set([
  GEMINI_MODEL,
  "gemini-1.5-flash-002",
  "gemini-1.5-pro"
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
    const { prompt } = req.body;
    const response = await createChatCompletion([
        {
          role: "user",
          content: `Generate 5 blog titles for: ${prompt}`,
        },
      ], 300);
    const content = response.choices[0].message.content;

    res.json({ success: true, content });

  } catch (error) {
    console.log("BLOG ERROR:", error.message);

    res.json({ success: false, message: "Failed to generate titles" });
  }
};

// ================== IMAGE ==================
export const generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64 = Buffer.from(data).toString("base64");

    const upload = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64}`
    );

    res.json({ success: true, content: upload.secure_url });

  } catch (error) {
    res.json({ success: false, message: "Image generation failed" });
  }
};

// ================== REMOVE BG ==================
export const removeImageBackground = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No image uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      transformation: [{ effect: "background_removal" }],
    });

    fs.unlinkSync(req.file.path);

    res.json({ success: true, content: result.secure_url });

  } catch (error) {
    res.json({ success: false, message: "Background removal failed" });
  }
};

// ================== REMOVE OBJECT ==================
export const removeImageObject = async (req, res) => {
  try {
    const { object } = req.body;
    if (!object || !object.trim()) {
      return res.json({ success: false, message: "Please provide object to remove" });
    }

    const upload = await cloudinary.uploader.upload(req.file.path);
    const normalizedObject = object
      .trim()
      .toLowerCase()
      .replace(/^remove\s+/, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const effectPrompt = `gen_remove:prompt_${normalizedObject}`;
    const url = cloudinary.url(upload.public_id, {
      resource_type: "image",
      type: "upload",
      secure: true,
      sign_url: true,
      transformation: [{ effect: effectPrompt }],
    });

    fs.unlinkSync(req.file.path);

    res.json({ success: true, content: url });

  } catch (error) {
    console.log("OBJECT REMOVE ERROR:", error.message);
    res.json({ success: false, message: "Object removal failed" });
  }
};

// ================== RESUME REVIEW ==================
export const resumeReview = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "Please upload a resume PDF" });
    }

    const buffer = fs.readFileSync(req.file.path);
    const parser = new PDFParse({ data: buffer });
    const data = await parser.getText();
    await parser.destroy();

    let content = "";
    try {
      const response = await createChatCompletion([
        {
          role: "user",
          content: `Review this resume and give constructive feedback on strengths, weaknesses, and improvements:\n\n${data.text}`,
        },
      ], 1000);
      content = response.choices[0].message.content;
    } catch (aiError) {
      console.log("RESUME AI PROVIDER ERROR:", aiError?.status, aiError?.message);
      content = buildResumeFallbackReview(data.text);
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      content,
    });

  } catch (error) {
    console.log("RESUME ERROR:", error.message);
    res.json({ success: false, message: error.message || "Resume review failed" });
  }
};