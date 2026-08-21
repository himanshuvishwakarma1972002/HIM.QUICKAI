import express from "express";
import { auth, requireAuth } from "../middlewares/auth.js";
import {
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
  getCreationLikes,
} from "../controllers/userController.js";

const userRouter = express.Router();

// Dashboard read path — JWT only (no Clerk Admin API)
userRouter.get('/get-user-creations', requireAuth, getUserCreations);
userRouter.get('/get-published-creations', getPublishedCreations);
userRouter.get('/get-creation-likes/:id', auth, getCreationLikes);
userRouter.post('/toggle-like-creations', auth, toggleLikeCreation);

export default userRouter;
