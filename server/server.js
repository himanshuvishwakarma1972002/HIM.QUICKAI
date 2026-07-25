import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';

import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoutes.js';
import connectCloudinary from './configs/cloudinary.js';

const app = express();

// ✅ Connect Cloudinary
await connectCloudinary();

// ✅ Middlewares
app.use(cors({
  origin: '*', // production में specific domain डालना
  credentials: true
}));

app.use(express.json());
app.use(clerkMiddleware());

// ✅ Timeout for AI responses
app.use((req, res, next) => {
  // Video generation (Veo) can take several minutes
  res.setTimeout(360000);
  next();
});

// ✅ Test route
app.get('/', (req, res) => {
  res.send('✅ Him.AI is Live!');
});

// ✅ API routes
app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// ❌ 404 Handler (IMPORTANT)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// ❌ Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;