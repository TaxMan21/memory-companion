import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

function generateAIResponse(user, memories, message, personality) {
  const recentMemories = memories.slice(0, 5);
  const memoryCount = memories.length;
  const tags = [...new Set(memories.flatMap(m => JSON.parse(m.tags || '[]')))];
  const style = personality?.style || 'friendly';
  const humor = personality?.humor_level || 5;

  const moodCounts = {};
  memories.forEach(m => {
    if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  const lowercaseMsg = message.toLowerCase();

  const stylePrefix = style === 'professional' ? 'Based on my analysis' :
    style === 'motivational' ? 'You\'ve got this' :
    style === 'coach' ? 'Here\'s my coaching perspective' :
    style === 'mentor' ? 'Let me share some wisdom' :
    style === 'casual' ? 'Hey' : '';

  if (lowercaseMsg.includes('summary') || lowercaseMsg.includes('overview') || lowercaseMsg.includes('recap')) {
    return {
      response: `${stylePrefix} ${user.name}, you've recorded ${memoryCount} memories, most common mood: "${dominantMood}". Key topics: ${tags.slice(0, 8).join(', ') || 'none yet'}.`,
      insights: { memoryCount, dominantMood, topTags: tags.slice(0, 5) }
    };
  }

  if (lowercaseMsg.includes('forget') || lowercaseMsg.includes('forgotten') || lowercaseMsg.includes('remind')) {
    if (recentMemories.length === 0) {
      return { response: `${user.name}, you haven't recorded any memories yet.`, insights: null };
    }
    const random = recentMemories[Math.floor(Math.random() * recentMemories.length)];
    return {
      response: `${stylePrefix} On ${random.created_at?.split('T')[0] || 'a recent day'}, you wrote about "${random.title}": "${random.content?.substring(0, 200)}"`,
      insights: { memoryId: random.id, title: random.title, date: random.created_at }
    };
  }

  if (lowercaseMsg.includes('mood') || lowercaseMsg.includes('feeling') || lowercaseMsg.includes('emotion')) {
    return {
      response: `${stylePrefix} ${user.name}, your predominant mood is "${dominantMood}". Moods: ${Object.entries(moodCounts).map(([m, c]) => `${m} (${c}x)`).join(', ') || 'none yet'}. How are you feeling right now?`,
      insights: { moodDistribution: moodCounts, dominantMood }
    };
  }

  if (lowercaseMsg.includes('suggest') || lowercaseMsg.includes('idea') || lowercaseMsg.includes('what should')) {
    return {
      response: `${stylePrefix} based on your themes (${tags.slice(0, 5).join(', ') || 'various topics'}), try recording a sensory memory today. What's one beautiful thing that happened recently?`,
      insights: { suggestion: 'Record a sensory memory', basedOnTags: tags.slice(0, 3) }
    };
  }

  if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi') || lowercaseMsg.includes('hey')) {
    return {
      response: `${stylePrefix} ${user.name}! I'm your companion. You have ${memoryCount} memories. Want a summary, a suggestion, or to recall something?`,
      insights: { memoryCount }
    };
  }

  if (lowercaseMsg.includes('goal') || lowercaseMsg.includes('project')) {
    const goals = db.prepare("SELECT title, progress, status FROM goals WHERE user_id = ? AND status = 'active'").all(user.id);
    if (goals.length > 0) {
      return {
        response: `${stylePrefix} ${user.name}, you have ${goals.length} active goals: ${goals.map(g => `"${g.title}" (${g.progress}%)`).join(', ')}. Keep pushing forward!`,
        insights: { goals: goals.length, goalList: goals }
      };
    }
    return {
      response: `${stylePrefix} ${user.name}, you don't have any active goals yet. Want to create one? I can help you track milestones and progress.`,
      insights: { goals: 0 }
    };
  }

  const thoughtfulResponses = [
    `${stylePrefix} ${user.name}, your ${memoryCount} memories weave a unique story. Want to explore a particular theme?`,
    `${stylePrefix} ${user.name}, I see "${tags[0] || 'life'}" as a common thread in your ${memoryCount} memories.`,
    `${stylePrefix} ${user.name}, you've shared ${memoryCount} moments. Is there a specific memory to revisit?`
  ];

  return {
    response: thoughtfulResponses[Math.floor(Math.random() * thoughtfulResponses.length)],
    insights: { memoryCount, dominantMood }
  };
}

// ─── Chat (save messages to history) ─────────────────────
router.post('/chat', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  try {
    const { message, conversation_id, message_type, file_url } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    const convId = conversation_id || uuidv4();
    const userMsgId = uuidv4();

    db.prepare(
      'INSERT INTO chat_messages (id, user_id, role, content, message_type, file_url, conversation_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userMsgId, req.user.id, 'user', message.trim(), message_type || 'text', file_url || null, convId);

    const memories = db.prepare(
      'SELECT id, title, content, mood, tags, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(req.user.id);

    const personality = db.prepare('SELECT * FROM personality_preferences WHERE user_id = ?').get(req.user.id);

    const result = generateAIResponse(req.user, memories, message.trim(), personality);
    const aiMsgId = uuidv4();

    db.prepare(
      'INSERT INTO chat_messages (id, user_id, role, content, message_type, conversation_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(aiMsgId, req.user.id, 'assistant', result.response, 'text', convId);

    res.json({ ...result, conversation_id: convId, userMessageId: userMsgId, aiMessageId: aiMsgId });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// ─── Conversation history ────────────────────────────────
router.get('/conversations', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  const conversations = db.prepare(
    `SELECT conversation_id, content as last_message, role, created_at FROM chat_messages
     WHERE user_id = ? AND role = 'user'
     ORDER BY created_at DESC`
  ).all(req.user.id);

  const grouped = {};
  conversations.forEach(c => {
    if (!grouped[c.conversation_id]) {
      grouped[c.conversation_id] = {
        id: c.conversation_id,
        lastMessage: c.last_message,
        lastMessageAt: c.created_at
      };
    }
  });

  res.json({ conversations: Object.values(grouped).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)) });
});

router.get('/conversations/:id', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  const messages = db.prepare(
    'SELECT id, role, content, message_type, file_url, created_at FROM chat_messages WHERE user_id = ? AND conversation_id = ? ORDER BY created_at ASC'
  ).all(req.user.id, req.params.id);

  res.json({ messages });
});

router.delete('/conversations/:id', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE user_id = ? AND conversation_id = ?').run(req.user.id, req.params.id);
  res.json({ message: 'Conversation deleted' });
});

// ─── Insights ────────────────────────────────────────────
router.get('/insights', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  try {
    const memories = db.prepare(
      'SELECT mood, tags, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC'
    ).all(req.user.id);

    const tagCounts = {};
    const moodTrend = [];
    const monthlyCounts = {};

    memories.forEach(m => {
      const tags = JSON.parse(m.tags || '[]');
      tags.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      if (m.mood) moodTrend.push({ date: m.created_at?.split('T')[0], mood: m.mood });
      const month = m.created_at?.substring(0, 7);
      if (month) monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

    res.json({
      insights: {
        totalMemories: memories.length,
        topTags, moodTrend, monthlyActivity: monthlyCounts,
        mostActiveMonth: Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
      }
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
