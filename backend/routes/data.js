import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Export all of a user's data (GDPR Art. 20 — data portability)
router.get('/export', authenticateToken, apiLimiter, (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, email, name, created_at, subscription_status FROM users WHERE id = ?'
    ).get(req.user.id);

    const memories = db.prepare(
      'SELECT id, title, content, mood, tags, created_at, updated_at FROM memories WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const parsedMemories = memories.map(m => ({
      ...m,
      tags: JSON.parse(m.tags || '[]')
    }));

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        memberSince: user.created_at,
        subscriptionStatus: user.subscription_status
      },
      memories: parsedMemories,
      memoryCount: parsedMemories.length
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="memory-companion-export-${req.user.id}.json"`);
    res.json(exportData);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Delete account and all associated data (GDPR Art. 17 — right to erasure)
router.delete('/account', authenticateToken, apiLimiter, (req, res) => {
  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM memories WHERE user_id = ?').run(req.user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);

    res.json({ message: 'Account and all associated data permanently deleted' });
  } catch (err) {
    console.error('Account deletion error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Request deletion confirmation (sends email in production — logs here)
router.post('/request-deletion', authenticateToken, apiLimiter, (req, res) => {
  try {
    console.log(`Deletion requested for user: ${req.user.id} (${req.user.email})`);

    res.json({
      message: 'Deletion request received. Your account will be deleted within 30 days per our policy.',
      note: 'In production, a confirmation email would be sent to verify this request.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

export default router;
