import express from "express";
import { auth } from "../middlewares/auth.js";
import {
  getPublishedCreations,
  getUserCreations,
  toggleLikeCreation,
  getCreationLikes,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/get-user-creations', auth, getUserCreations);
userRouter.get('/get-published-creations', getPublishedCreations);
userRouter.get('/get-creation-likes/:id', auth, getCreationLikes);
userRouter.post('/toggle-like-creations', auth, toggleLikeCreation);

export default userRouter;