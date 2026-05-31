import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken, requireSubscription, checkDemoLimit } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

const MAX_TRIAL_MEMORIES = 5;

function canCreateMemory(user) {
  if (user.subscription_status === 'active') return true;
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM memories WHERE user_id = ?'
  ).get(user.id).count;
  return count < MAX_TRIAL_MEMORIES;
}

router.get('/', authenticateToken, apiLimiter, (req, res) => {
  try {
    const memories = db.prepare(
      'SELECT id, title, content, mood, tags, created_at, updated_at FROM memories WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const parsed = memories.map(m => ({
      ...m,
      tags: JSON.parse(m.tags || '[]')
    }));

    res.json({ memories: parsed });
  } catch (err) {
    console.error('Fetch memories error:', err);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

router.get('/:id', authenticateToken, apiLimiter, (req, res) => {
  try {
    const memory = db.prepare(
      'SELECT id, title, content, mood, tags, created_at, updated_at FROM memories WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    memory.tags = JSON.parse(memory.tags || '[]');
    res.json({ memory });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

router.post('/', authenticateToken, apiLimiter, (req, res) => {
  try {
    if (!canCreateMemory(req.user)) {
      return res.status(403).json({
        error: 'Trial limit reached. Subscribe to create unlimited memories.',
        code: 'MEMORY_LIMIT_REACHED'
      });
    }

    const { title, content, mood, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ error: 'Title must be under 200 characters' });
    }
    if (content.length > 10000) {
      return res.status(400).json({ error: 'Content must be under 10000 characters' });
    }

    const id = uuidv4();
    const tagsJson = JSON.stringify(tags || []);

    db.prepare(
      'INSERT INTO memories (id, user_id, title, content, mood, tags) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.user.id, title.trim(), content.trim(), mood || null, tagsJson);

    const memory = db.prepare(
      'SELECT id, title, content, mood, tags, created_at, updated_at FROM memories WHERE id = ?'
    ).get(id);
    memory.tags = JSON.parse(memory.tags || '[]');

    res.status(201).json({ memory });
  } catch (err) {
    console.error('Create memory error:', err);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

router.put('/:id', authenticateToken, apiLimiter, (req, res) => {
  try {
    const existing = db.prepare(
      'SELECT id FROM memories WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.id);

    if (!existing) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    const { title, content, mood, tags } = req.body;

    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    if (title && title.length > 200) {
      return res.status(400).json({ error: 'Title must be under 200 characters' });
    }
    if (content && content.length > 10000) {
      return res.status(400).json({ error: 'Content must be under 10000 characters' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title.trim()); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content.trim()); }
    if (mood !== undefined) { updates.push('mood = ?'); params.push(mood); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push("updated_at = datetime('now')");
    params.push(req.params.id, req.user.id);

    db.prepare(
      `UPDATE memories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...params);

    const memory = db.prepare(
      'SELECT id, title, content, mood, tags, created_at, updated_at FROM memories WHERE id = ?'
    ).get(req.params.id);
    memory.tags = JSON.parse(memory.tags || '[]');

    res.json({ memory });
  } catch (err) {
    console.error('Update memory error:', err);
    res.status(500).json({ error: 'Failed to update memory' });
  }
});

router.delete('/:id', authenticateToken, apiLimiter, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM memories WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ message: 'Memory deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;
