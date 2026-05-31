import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { initializeDatabase } from './db/init.js';
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memories.js';
import aiRoutes from './routes/ai.js';
import subscriptionRoutes from './routes/subscription.js';
import dataRoutes from './routes/data.js';
import featuresRoutes from './routes/features.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate required env vars at startup
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET must be set in .env');
  process.exit(1);
}
if (!process.env.FRONTEND_URL) {
  console.error('FATAL: FRONTEND_URL must be set in .env (e.g. https://yourdomain.com)');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

initializeDatabase();

const ALLOWED_ORIGINS = process.env.FRONTEND_URL.split(',').map(s => s.trim());

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", ...ALLOWED_ORIGINS],
      fontSrc: ["'self'"]
    }
  }
}));

// Apply CORS globally (needed for crossorigin module scripts)
app.use(cors({
  origin: function (origin, cb) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/features', featuresRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const publicDir = join(__dirname, 'public');
if (existsSync(join(publicDir, 'index.html'))) {
  app.use(express.static(publicDir, {
    maxAge: '1y',
    immutable: true
  }));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return;
    res.sendFile(join(publicDir, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Memory Companion running on http://localhost:${PORT}`);
  if (!existsSync(join(publicDir, 'index.html'))) {
    console.log('Note: Frontend not built yet. Run "npm run build" from the frontend directory.');
  }
});
