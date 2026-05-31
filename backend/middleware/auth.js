import jwt from 'jsonwebtoken';
import db from '../db/database.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const session = db.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')"
    ).get(token);

    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    const user = db.prepare(
      'SELECT id, email, name, subscription_status, payment_method, demo_used, created_at FROM users WHERE id = ?'
    ).get(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.sessionId = session.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireSubscription(req, res, next) {
  if (req.user.subscription_status !== 'active') {
    return res.status(403).json({
      error: 'Subscription required',
      code: 'SUBSCRIPTION_REQUIRED'
    });
  }
  next();
}

export function checkDemoLimit(req, res, next) {
  if (req.user.demo_used >= 1) {
    return res.status(403).json({
      error: 'Demo already used',
      code: 'DEMO_EXHAUSTED'
    });
  }
  next();
}
