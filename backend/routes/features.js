import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.use(authenticateToken);
router.use(apiLimiter);

// ─── Profile ─────────────────────────────────────────────
router.get('/profile', (req, res) => {
  let profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile: profile || {} });
});

router.put('/profile', (req, res) => {
  const { nickname, date_of_birth, avatar_url, timezone, language, onboarding_complete } = req.body;
  const existing = db.prepare('SELECT id FROM profiles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE profiles SET nickname=?, date_of_birth=?, avatar_url=?, timezone=?, language=?, onboarding_complete=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(nickname, date_of_birth, avatar_url, timezone || 'UTC', language || 'en', onboarding_complete ? 1 : 0, req.user.id);
  } else {
    db.prepare(
      `INSERT INTO profiles (id, user_id, nickname, date_of_birth, avatar_url, timezone, language, onboarding_complete) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), req.user.id, nickname, date_of_birth, avatar_url, timezone || 'UTC', language || 'en', onboarding_complete ? 1 : 0);
  }

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  res.json({ profile });
});

// ─── Personality Preferences ─────────────────────────────
router.get('/personality', (req, res) => {
  let prefs = db.prepare('SELECT * FROM personality_preferences WHERE user_id = ?').get(req.user.id);
  res.json({ preferences: prefs || {} });
});

router.put('/personality', (req, res) => {
  const { style, response_length, humor_level, communication_style } = req.body;
  const existing = db.prepare('SELECT id FROM personality_preferences WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE personality_preferences SET style=?, response_length=?, humor_level=?, communication_style=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(style || 'friendly', response_length || 'medium', humor_level || 5, communication_style || 'conversational', req.user.id);
  } else {
    db.prepare(
      `INSERT INTO personality_preferences (id, user_id, style, response_length, humor_level, communication_style) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), req.user.id, style || 'friendly', response_length || 'medium', humor_level || 5, communication_style || 'conversational');
  }

  const prefs = db.prepare('SELECT * FROM personality_preferences WHERE user_id = ?').get(req.user.id);
  res.json({ preferences: prefs });
});

// ─── Memory Permissions ──────────────────────────────────
router.get('/memory-permissions', (req, res) => {
  let perms = db.prepare('SELECT * FROM memory_permissions WHERE user_id = ?').get(req.user.id);
  res.json({ permissions: perms || {} });
});

router.put('/memory-permissions', (req, res) => {
  const { long_term_memory, categories, can_remember, cannot_remember } = req.body;
  const existing = db.prepare('SELECT id FROM memory_permissions WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE memory_permissions SET long_term_memory=?, categories=?, can_remember=?, cannot_remember=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(long_term_memory !== undefined ? (long_term_memory ? 1 : 0) : 1, JSON.stringify(categories || []), can_remember || 'everything', JSON.stringify(cannot_remember || []), req.user.id);
  } else {
    db.prepare(
      `INSERT INTO memory_permissions (id, user_id, long_term_memory, categories, can_remember, cannot_remember) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), req.user.id, long_term_memory !== undefined ? (long_term_memory ? 1 : 0) : 1, JSON.stringify(categories || []), can_remember || 'everything', JSON.stringify(cannot_remember || []));
  }

  const perms = db.prepare('SELECT * FROM memory_permissions WHERE user_id = ?').get(req.user.id);
  res.json({ permissions: perms });
});

// ─── Dashboard ───────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const recentMemories = db.prepare(
    'SELECT id, title, content, mood, tags, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).all(req.user.id).map(m => ({ ...m, tags: JSON.parse(m.tags || '[]') }));

  const activeGoals = db.prepare(
    'SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at DESC LIMIT 5'
  ).all(req.user.id, 'active');

  const todayEvents = db.prepare(
    "SELECT * FROM timeline_events WHERE user_id = ? AND event_date = ? ORDER BY importance DESC"
  ).all(req.user.id, today);

  const pendingTasks = db.prepare(
    "SELECT * FROM tasks WHERE user_id = ? AND status IN ('pending','in_progress') ORDER BY priority DESC, due_date ASC LIMIT 10"
  ).all(req.user.id);

  const quickNotes = db.prepare(
    'SELECT * FROM quick_notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5'
  ).all(req.user.id);

  const journalToday = db.prepare(
    "SELECT id, mood, mood_score FROM journal_entries WHERE user_id = ? AND date(created_at) = date('now') ORDER BY created_at DESC LIMIT 1"
  ).get(req.user.id);

  res.json({
    recentMemories,
    activeGoals: activeGoals.map(g => ({ ...g, milestones: db.prepare('SELECT * FROM milestones WHERE goal_id = ?').all(g.id) })),
    todayEvents,
    pendingTasks,
    quickNotes,
    journalToday,
    memoryCount: db.prepare('SELECT COUNT(*) as c FROM memories WHERE user_id = ?').get(req.user.id).c
  });
});

// ─── Goals ───────────────────────────────────────────────
router.get('/goals', (req, res) => {
  const { status } = req.query;
  let goals;
  if (status) {
    goals = db.prepare('SELECT * FROM goals WHERE user_id = ? AND status = ? ORDER BY created_at DESC').all(req.user.id, status);
  } else {
    goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  }
  res.json({ goals: goals.map(g => ({ ...g, milestones: db.prepare('SELECT * FROM milestones WHERE goal_id = ? ORDER BY created_at ASC').all(g.id) })) });
});

router.post('/goals', (req, res) => {
  const { title, description, category, target_date } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO goals (id, user_id, title, description, category, target_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title.trim(), description, category || 'personal', target_date || null);
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.status(201).json({ goal });
});

router.put('/goals/:id', (req, res) => {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { title, description, category, status, progress, target_date } = req.body;
  db.prepare(
    `UPDATE goals SET title=COALESCE(?,title), description=COALESCE(?,description), category=COALESCE(?,category), status=COALESCE(?,status), progress=COALESCE(?,progress), target_date=COALESCE(?,target_date), updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(title, description, category, status, progress, target_date, req.params.id, req.user.id);

  if (status === 'completed') {
    db.prepare("UPDATE goals SET completed_at=datetime('now') WHERE id=?").run(req.params.id);
  }

  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id);
  res.json({ goal: updated });
});

router.delete('/goals/:id', (req, res) => {
  const result = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

// ─── Milestones ──────────────────────────────────────────
router.post('/milestones', (req, res) => {
  const { goal_id, title } = req.body;
  if (!goal_id || !title) return res.status(400).json({ error: 'Goal ID and title required' });
  const goal = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(goal_id, req.user.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO milestones (id, goal_id, title) VALUES (?, ?, ?)').run(id, goal_id, title);
  const milestone = db.prepare('SELECT * FROM milestones WHERE id = ?').get(id);
  res.status(201).json({ milestone });
});

router.put('/milestones/:id', (req, res) => {
  const milestone = db.prepare(
    'SELECT m.* FROM milestones m JOIN goals g ON m.goal_id = g.id WHERE m.id = ? AND g.user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  const { completed } = req.body;
  if (completed) {
    db.prepare("UPDATE milestones SET completed=1, completed_at=datetime('now') WHERE id=?").run(req.params.id);
    const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);

    const goalMilestones = db.prepare('SELECT completed FROM milestones WHERE goal_id = ?').all(milestone.goal_id);
    const completedCount = goalMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / goalMilestones.length) * 100);
    db.prepare('UPDATE goals SET progress=? WHERE id=?').run(progress, milestone.goal_id);

    res.json({ milestone: updated });
  } else {
    db.prepare('UPDATE milestones SET completed=0, completed_at=NULL WHERE id=?').run(req.params.id);
    const updated = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);
    res.json({ milestone: updated });
  }
});

router.delete('/milestones/:id', (req, res) => {
  const milestone = db.prepare(
    'SELECT m.* FROM milestones m JOIN goals g ON m.goal_id = g.id WHERE m.id = ? AND g.user_id = ?'
  ).get(req.params.id, req.user.id);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ message: 'Milestone deleted' });
});

// ─── Journal ─────────────────────────────────────────────
router.get('/journal', (req, res) => {
  const { limit, offset } = req.query;
  const entries = db.prepare(
    'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(req.user.id, parseInt(limit) || 50, parseInt(offset) || 0);

  res.json({ entries: entries.map(e => ({ ...e, tags: JSON.parse(e.tags || '[]') })) });
});

router.post('/journal', (req, res) => {
  const { title, content, mood, mood_score, tags } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO journal_entries (id, user_id, title, content, mood, mood_score, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title, content.trim(), mood || null, mood_score || null, JSON.stringify(tags || []));
  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
  entry.tags = JSON.parse(entry.tags || '[]');
  res.status(201).json({ entry });
});

router.put('/journal/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM journal_entries WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Entry not found' });

  const { title, content, mood, mood_score, tags } = req.body;
  db.prepare(
    `UPDATE journal_entries SET title=COALESCE(?,title), content=COALESCE(?,content), mood=COALESCE(?,mood), mood_score=COALESCE(?,mood_score), tags=COALESCE(?,tags), updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(title, content, mood, mood_score, tags ? JSON.stringify(tags) : null, req.params.id, req.user.id);

  const entry = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(req.params.id);
  entry.tags = JSON.parse(entry.tags || '[]');
  res.json({ entry });
});

router.delete('/journal/:id', (req, res) => {
  const result = db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entry not found' });
  res.json({ message: 'Entry deleted' });
});

// ─── Relationships ───────────────────────────────────────
router.get('/relationships', (req, res) => {
  const relations = db.prepare('SELECT * FROM relationships WHERE user_id = ? ORDER BY name ASC').all(req.user.id);
  res.json({ relationships: relations });
});

router.post('/relationships', (req, res) => {
  const { name, relation_type, email, phone, important_date, date_label, notes } = req.body;
  if (!name || !relation_type) return res.status(400).json({ error: 'Name and relation type required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO relationships (id, user_id, name, relation_type, email, phone, important_date, date_label, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, name, relation_type, email, phone, important_date, date_label, notes);
  const rel = db.prepare('SELECT * FROM relationships WHERE id = ?').get(id);
  res.status(201).json({ relationship: rel });
});

router.put('/relationships/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM relationships WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Relationship not found' });

  const { name, relation_type, email, phone, important_date, date_label, notes } = req.body;
  db.prepare(
    `UPDATE relationships SET name=COALESCE(?,name), relation_type=COALESCE(?,relation_type), email=COALESCE(?,email), phone=COALESCE(?,phone), important_date=COALESCE(?,important_date), date_label=COALESCE(?,date_label), notes=COALESCE(?,notes), updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(name, relation_type, email, phone, important_date, date_label, notes, req.params.id, req.user.id);

  const rel = db.prepare('SELECT * FROM relationships WHERE id = ?').get(req.params.id);
  res.json({ relationship: rel });
});

router.delete('/relationships/:id', (req, res) => {
  const result = db.prepare('DELETE FROM relationships WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Relationship not found' });
  res.json({ message: 'Relationship deleted' });
});

// ─── Interactions ────────────────────────────────────────
router.get('/relationships/:id/interactions', (req, res) => {
  const rel = db.prepare('SELECT id FROM relationships WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!rel) return res.status(404).json({ error: 'Relationship not found' });
  const interactions = db.prepare('SELECT * FROM interactions WHERE relationship_id = ? ORDER BY occurred_at DESC').all(req.params.id);
  res.json({ interactions });
});

router.post('/relationships/:id/interactions', (req, res) => {
  const rel = db.prepare('SELECT id FROM relationships WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!rel) return res.status(404).json({ error: 'Relationship not found' });

  const { interaction_type, notes } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO interactions (id, relationship_id, interaction_type, notes) VALUES (?, ?, ?, ?)').run(id, req.params.id, interaction_type, notes);
  const interaction = db.prepare('SELECT * FROM interactions WHERE id = ?').get(id);
  res.status(201).json({ interaction });
});

// ─── Knowledge Base ──────────────────────────────────────
router.get('/knowledge-base', (req, res) => {
  const { file_type } = req.query;
  let items;
  if (file_type) {
    items = db.prepare('SELECT * FROM knowledge_base WHERE user_id = ? AND file_type = ? ORDER BY updated_at DESC').all(req.user.id, file_type);
  } else {
    items = db.prepare('SELECT * FROM knowledge_base WHERE user_id = ? ORDER BY updated_at DESC').all(req.user.id);
  }
  res.json({ items: items.map(i => ({ ...i, tags: JSON.parse(i.tags || '[]') })) });
});

router.post('/knowledge-base', (req, res) => {
  const { title, content, file_type, tags } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO knowledge_base (id, user_id, title, content, file_type, tags) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title.trim(), content, file_type || 'note', JSON.stringify(tags || []));
  const item = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id);
  item.tags = JSON.parse(item.tags || '[]');
  res.status(201).json({ item });
});

router.put('/knowledge-base/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM knowledge_base WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { title, content, file_type, tags } = req.body;
  db.prepare(
    `UPDATE knowledge_base SET title=COALESCE(?,title), content=COALESCE(?,content), file_type=COALESCE(?,file_type), tags=COALESCE(?,tags), updated_at=datetime('now') WHERE id=? AND user_id=?`
  ).run(title, content, file_type, tags ? JSON.stringify(tags) : null, req.params.id, req.user.id);

  const item = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(req.params.id);
  item.tags = JSON.parse(item.tags || '[]');
  res.json({ item });
});

router.delete('/knowledge-base/:id', (req, res) => {
  const result = db.prepare('DELETE FROM knowledge_base WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
  res.json({ message: 'Item deleted' });
});

// ─── Tasks ───────────────────────────────────────────────
router.get('/tasks', (req, res) => {
  const { status, priority } = req.query;
  let query = 'SELECT * FROM tasks WHERE user_id = ?';
  const params = [req.user.id];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (priority) { query += ' AND priority = ?'; params.push(priority); }
  query += ' ORDER BY created_at DESC';

  const tasks = db.prepare(query).all(...params);
  res.json({ tasks });
});

router.post('/tasks', (req, res) => {
  const { title, description, priority, due_date, is_recurring, recurring_interval, category, reminder_at } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO tasks (id, user_id, title, description, priority, due_date, is_recurring, recurring_interval, category, reminder_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, title.trim(), description, priority || 'medium', due_date || null, is_recurring ? 1 : 0, recurring_interval || null, category || 'general', reminder_at || null);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.status(201).json({ task });
});

router.put('/tasks/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Task not found' });

  const { title, description, priority, status, due_date, is_recurring, recurring_interval, category, reminder_at } = req.body;
  let setClauses = [];
  const params = [];

  if (title !== undefined) { setClauses.push('title = ?'); params.push(title); }
  if (description !== undefined) { setClauses.push('description = ?'); params.push(description); }
  if (priority !== undefined) { setClauses.push('priority = ?'); params.push(priority); }
  if (status !== undefined) { setClauses.push('status = ?'); params.push(status); }
  if (due_date !== undefined) { setClauses.push('due_date = ?'); params.push(due_date); }
  if (is_recurring !== undefined) { setClauses.push('is_recurring = ?'); params.push(is_recurring ? 1 : 0); }
  if (recurring_interval !== undefined) { setClauses.push('recurring_interval = ?'); params.push(recurring_interval); }
  if (category !== undefined) { setClauses.push('category = ?'); params.push(category); }
  if (reminder_at !== undefined) { setClauses.push('reminder_at = ?'); params.push(reminder_at); }

  if (status === 'completed') {
    setClauses.push("completed_at = datetime('now')");
  }

  setClauses.push("updated_at = datetime('now')");
  params.push(req.params.id, req.user.id);

  db.prepare(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ task });
});

router.delete('/tasks/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tasks WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

// ─── Timeline ────────────────────────────────────────────
router.get('/timeline', (req, res) => {
  const { start_date, end_date, limit } = req.query;
  let query = 'SELECT * FROM timeline_events WHERE user_id = ?';
  const params = [req.user.id];

  if (start_date) { query += ' AND event_date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND event_date <= ?'; params.push(end_date); }
  query += ' ORDER BY event_date DESC, importance DESC';

  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }

  const events = db.prepare(query).all(...params);
  res.json({ events });
});

router.post('/timeline', (req, res) => {
  const { event_type, title, description, event_date, importance } = req.body;
  if (!event_type || !title || !event_date) return res.status(400).json({ error: 'Event type, title, and date required' });

  const id = uuidv4();
  db.prepare(
    'INSERT INTO timeline_events (id, user_id, event_type, title, description, event_date, importance) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.user.id, event_type, title, description, event_date, importance || 5);
  const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get(id);
  res.status(201).json({ event });
});

router.delete('/timeline/:id', (req, res) => {
  const result = db.prepare('DELETE FROM timeline_events WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Event not found' });
  res.json({ message: 'Event deleted' });
});

// ─── Daily Briefing ──────────────────────────────────────
router.get('/briefing', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let briefing = db.prepare('SELECT * FROM daily_briefings WHERE user_id = ? AND briefing_date = ?').get(req.user.id, today);

  if (!briefing) {
    const pendingTasks = db.prepare("SELECT id, title, priority, due_date FROM tasks WHERE user_id = ? AND status IN ('pending','in_progress') ORDER BY priority DESC LIMIT 5").all(req.user.id);
    const todayEvents = db.prepare('SELECT title, event_type FROM timeline_events WHERE user_id = ? AND event_date = ? ORDER BY importance DESC').all(req.user.id, today);
    const activeGoals = db.prepare('SELECT title, progress FROM goals WHERE user_id = ? AND status = ?').all(req.user.id, 'active');
    const journalCount = db.prepare("SELECT COUNT(*) as c FROM journal_entries WHERE user_id = ? AND date(created_at) = date('now')").get(req.user.id).c;
    const birthdays = db.prepare("SELECT name, relation_type FROM relationships WHERE user_id = ? AND important_date = ?").all(req.user.id, today);

    const content = JSON.stringify({
      tasks: pendingTasks,
      events: todayEvents,
      goals: activeGoals,
      journalWritten: journalCount > 0,
      birthdays
    });

    const id = uuidv4();
    db.prepare('INSERT INTO daily_briefings (id, user_id, briefing_date, content) VALUES (?, ?, ?, ?)').run(id, req.user.id, today, content);
    briefing = { id, briefing_date: today, content, generated_at: new Date().toISOString() };
  }

  res.json({ briefing: { ...briefing, data: JSON.parse(briefing.content) } });
});

// ─── Quick Notes ─────────────────────────────────────────
router.get('/quick-notes', (req, res) => {
  const notes = db.prepare('SELECT * FROM quick_notes WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ notes });
});

router.post('/quick-notes', (req, res) => {
  const { content, color } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

  const id = uuidv4();
  db.prepare('INSERT INTO quick_notes (id, user_id, content, color) VALUES (?, ?, ?, ?)').run(id, req.user.id, content.trim(), color || 'yellow');
  const note = db.prepare('SELECT * FROM quick_notes WHERE id = ?').get(id);
  res.status(201).json({ note });
});

router.delete('/quick-notes/:id', (req, res) => {
  const result = db.prepare('DELETE FROM quick_notes WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ message: 'Note deleted' });
});

// ─── AI Companion Profile ────────────────────────────────
router.get('/companion-profile', (req, res) => {
  let profile = db.prepare('SELECT * FROM ai_companion_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ companionProfile: profile || {} });
});

router.put('/companion-profile', (req, res) => {
  const { ai_name, ai_avatar, personality_traits, voice, backstory, custom_instructions } = req.body;
  const existing = db.prepare('SELECT id FROM ai_companion_profiles WHERE user_id = ?').get(req.user.id);

  if (existing) {
    db.prepare(
      `UPDATE ai_companion_profiles SET ai_name=?, ai_avatar=?, personality_traits=?, voice=?, backstory=?, custom_instructions=?, updated_at=datetime('now') WHERE user_id=?`
    ).run(ai_name || 'AI Companion', ai_avatar || 'default', JSON.stringify(personality_traits || ['helpful', 'empathetic']), voice || 'default', backstory, custom_instructions, req.user.id);
  } else {
    db.prepare(
      `INSERT INTO ai_companion_profiles (id, user_id, ai_name, ai_avatar, personality_traits, voice, backstory, custom_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), req.user.id, ai_name || 'AI Companion', ai_avatar || 'default', JSON.stringify(personality_traits || ['helpful', 'empathetic']), voice || 'default', backstory, custom_instructions);
  }

  const profile = db.prepare('SELECT * FROM ai_companion_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ companionProfile: profile });
});

// ─── Integrations ────────────────────────────────────────
router.get('/integrations', (req, res) => {
  const integrations = db.prepare('SELECT * FROM integrations WHERE user_id = ? ORDER BY service_name ASC').all(req.user.id);
  res.json({ integrations });
});

router.put('/integrations/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM integrations WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Integration not found' });

  const { enabled, config } = req.body;
  db.prepare(
    'UPDATE integrations SET enabled=?, config=?, updated_at=datetime(\'now\') WHERE id=? AND user_id=?'
  ).run(enabled ? 1 : 0, config ? JSON.stringify(config) : '{}', req.params.id, req.user.id);

  const integration = db.prepare('SELECT * FROM integrations WHERE id = ?').get(req.params.id);
  res.json({ integration });
});

// ─── Pin / Unpin Memories ────────────────────────────────
router.post('/pin-memory/:memoryId', (req, res) => {
  const memory = db.prepare('SELECT id FROM memories WHERE id = ? AND user_id = ?').get(req.params.memoryId, req.user.id);
  if (!memory) return res.status(404).json({ error: 'Memory not found' });

  const existing = db.prepare('SELECT id FROM pinned_memories WHERE user_id = ? AND memory_id = ?').get(req.user.id, req.params.memoryId);
  if (existing) {
    db.prepare('DELETE FROM pinned_memories WHERE id = ?').run(existing.id);
    res.json({ pinned: false });
  } else {
    db.prepare('INSERT INTO pinned_memories (id, user_id, memory_id) VALUES (?, ?, ?)').run(uuidv4(), req.user.id, req.params.memoryId);
    res.json({ pinned: true });
  }
});

router.get('/pinned-memories', (req, res) => {
  const pinned = db.prepare(
    'SELECT m.id, m.title, m.content, m.mood, m.tags, m.created_at FROM pinned_memories pm JOIN memories m ON pm.memory_id = m.id WHERE pm.user_id = ? ORDER BY pm.pinned_at DESC'
  ).all(req.user.id);
  res.json({ memories: pinned.map(m => ({ ...m, tags: JSON.parse(m.tags || '[]') })) });
});

// ─── Insights ────────────────────────────────────────────
router.get('/insights', (req, res) => {
  const totalMemories = db.prepare('SELECT COUNT(*) as c FROM memories WHERE user_id = ?').get(req.user.id).c;
  const totalJournal = db.prepare('SELECT COUNT(*) as c FROM journal_entries WHERE user_id = ?').get(req.user.id).c;
  const totalTasks = db.prepare('SELECT COUNT(*) as c FROM tasks WHERE user_id = ?').get(req.user.id).c;
  const completedTasks = db.prepare("SELECT COUNT(*) as c FROM tasks WHERE user_id = ? AND status='completed'").get(req.user.id).c;
  const activeGoals = db.prepare("SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status='active'").get(req.user.id).c;
  const completedGoals = db.prepare("SELECT COUNT(*) as c FROM goals WHERE user_id = ? AND status='completed'").get(req.user.id).c;

  const moodTrend = db.prepare(
    'SELECT mood, mood_score, date(created_at) as date FROM journal_entries WHERE user_id = ? AND mood_score IS NOT NULL ORDER BY created_at DESC LIMIT 30'
  ).all(req.user.id);

  const topMoods = db.prepare(
    'SELECT mood, COUNT(*) as count FROM journal_entries WHERE user_id = ? AND mood IS NOT NULL GROUP BY mood ORDER BY count DESC LIMIT 5'
  ).all(req.user.id);

  const recentActivity = db.prepare(
    "SELECT date(created_at) as date, COUNT(*) as count FROM memories WHERE user_id = ? AND created_at >= date('now', '-30 days') GROUP BY date(created_at) ORDER BY date DESC"
  ).all(req.user.id);

  const topTags = db.prepare(
    'SELECT tags FROM memories WHERE user_id = ? AND tags IS NOT NULL'
  ).all(req.user.id);

  const tagCount = {};
  topTags.forEach(m => {
    JSON.parse(m.tags || '[]').forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
  });

  const taskCompletion = completedTasks > 0 && totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    insights: {
      totals: { memories: totalMemories, journal: totalJournal, tasks: totalTasks, goals: activeGoals },
      completions: { tasks: taskCompletion, goals: completedGoals > 0 ? Math.round((completedGoals / (activeGoals + completedGoals)) * 100) : 0 },
      moodTrend,
      topMoods,
      recentActivity,
      topTags: Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }))
    }
  });
});

export default router;