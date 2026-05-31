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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

initializeDatabase();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));

app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/data', dataRoutes);

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
