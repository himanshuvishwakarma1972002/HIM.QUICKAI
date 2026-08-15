import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';

import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import { validateEnv } from './configs/env.js';
import { getFrontendOrigins } from './configs/origins.js';

const app = express();

validateEnv();

await connectCloudinary();

const frontendOrigins = getFrontendOrigins();

app.use(
  cors({
    origin(origin, callback) {
      // Non-browser clients (curl, server health checks) have no Origin
      if (!origin || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(express.json());

// Cross-origin frontend (Render) + local Vite — validate JWT azp claim
app.use(
  clerkMiddleware({
    authorizedParties: frontendOrigins,
  })
);

app.use((req, res, next) => {
  res.setTimeout(360000);
  next();
});

app.get('/', (req, res) => {
  res.send('✅ Him.AI is Live!');
});

// Safe deploy check (no secrets) — confirms Clerk keys are loaded on Render
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    clerk: Boolean(
      process.env.CLERK_SECRET_KEY?.trim() &&
        process.env.CLERK_PUBLISHABLE_KEY?.trim()
    ),
    authorizedParties: frontendOrigins,
  });
});

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  if (err?.message?.startsWith('CORS blocked')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
  console.error(err);
  res.status(500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Clerk authorized parties: ${frontendOrigins.join(', ')}`);
  try {
    const pk = process.env.CLERK_PUBLISHABLE_KEY || '';
    const raw = pk.split('_').slice(2).join('_');
    const fapi = Buffer.from(raw, 'base64').toString('utf8').replace(/\$$/, '');
    console.log(`🔑 Clerk FAPI (must match client token iss): ${fapi}`);
  } catch {
    /* ignore */
  }
});

export default app;
