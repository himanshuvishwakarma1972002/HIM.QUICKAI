import express from 'express';
import { auth } from '../middlewares/auth.js';

import {
  generateArticle,
  generateBlogTitle,
  generateImage,
  removeImageBackground,
  removeImageObject,
  resumeReview,
  chatWithAI
} from '../controllers/aiController.js';

import { upload } from '../configs/multer.js';
import resumeUpload from '../middlewares/upload.js';

const aiRouter = express.Router();

// ✅ Content generation
aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-blog-title', auth, generateBlogTitle);
aiRouter.post('/generate-image', auth, generateImage);

// ✅ Image tools
aiRouter.post(
  '/remove-image-background',
  upload.single('image'),
  auth,
  removeImageBackground
);

aiRouter.post(
  '/remove-image-object',
  upload.single('image'),
  auth,
  removeImageObject
);

// ✅ CHAT ROUTE (MOST IMPORTANT)
aiRouter.post('/chat', auth, chatWithAI);

// ✅ Resume Upload Handler
const handleResumeUpload = (req, res, next) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message:
          err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large (max 5MB)'
            : err.message || 'Upload failed',
      });
    }
    next();
  });
};

aiRouter.post('/resume-review', handleResumeUpload, auth, resumeReview);

export default aiRouter;