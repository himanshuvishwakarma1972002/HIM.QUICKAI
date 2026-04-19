import "dotenv/config";
import sql from "../configs/db.js";
import { v2 as cloudinary } from "cloudinary";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
//import { GoogleGenerativeAI } from "@google/generative-ai";
import { createRequire } from "module";
import { clerkClient } from "@clerk/express";
import OpenAI from "openai";


const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

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
    const response = await AI.chat.completions.create({
      model: "gemini-3-flash-preview",
      messages: [{
              role: "user",
              content: prompt,
          },
      ],
      temperature: 0.7,
      max_tokens: length,
  });

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

    const model = getModel();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate 5 blog titles for: ${prompt}` }],
        },
      ],
    });

    const content = result.response.text();

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

    const upload = await cloudinary.uploader.upload(req.file.path);

    const url = cloudinary.url(upload.public_id, {
      transformation: [{ effect: `gen_remove:${object}` }],
    });

    fs.unlinkSync(req.file.path);

    res.json({ success: true, content: url });

  } catch (error) {
    res.json({ success: false, message: "Object removal failed" });
  }
};

// ================== RESUME REVIEW ==================
export const resumeReview = async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(buffer);

    const model = getModel();

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Review this resume and give suggestions:\n\n${data.text}`,
            },
          ],
        },
      ],
    });

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      content: result.response.text(),
    });

  } catch (error) {
    res.json({ success: false, message: "Resume review failed" });
  }
};