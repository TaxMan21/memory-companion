import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

function generateTokens(userId) {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).run(sessionId, userId, token, expiresAt);

  return { token, sessionId };
}

router.post('/signup', authLimiter, (req, res) => {
  try {
    const { email, password, name, tosAccepted, privacyAccepted, marketingConsent } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    if (!tosAccepted || !privacyAccepted) {
      return res.status(400).json({ error: 'You must accept the Terms of Service and Privacy Policy' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain an uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain a lowercase letter' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain a digit' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ error: 'Name must be between 2 and 50 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(password, 12);

    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, tos_accepted_at, privacy_accepted_at, marketing_consent) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, normalizedEmail, passwordHash, name, now, now, marketingConsent ? 1 : 0);

    db.prepare(
      'INSERT INTO consent_log (id, user_id, consent_type, granted) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)'
    ).run(
      uuidv4(), id, 'terms_of_service', 1,
      uuidv4(), id, 'privacy_policy', 1,
      uuidv4(), id, 'marketing', marketingConsent ? 1 : 0
    );

    const { token } = generateTokens(id);
    const user = db.prepare(
      'SELECT id, email, name, subscription_status, payment_method, demo_used, created_at, tos_accepted_at, privacy_accepted_at FROM users WHERE id = ?'
    ).get(id);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signin', authLimiter, (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Account locked. Try again later.' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      const attempts = (user.login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare(
          'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?'
        ).run(attempts, lockUntil, user.id);
        return res.status(423).json({ error: 'Account locked for 15 minutes due to too many failed attempts' });
      }
      db.prepare('UPDATE users SET login_attempts = ? WHERE id = ?').run(attempts, user.id);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const { token } = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription_status: user.subscription_status,
        payment_method: user.payment_method,
        demo_used: user.demo_used,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/signout', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
    res.json({ message: 'Signed out successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
