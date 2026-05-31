import { Router } from 'express';
import db from '../db/database.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

function generateAIResponse(user, memories, message) {
  const recentMemories = memories.slice(0, 5);
  const memoryCount = memories.length;
  const tags = [...new Set(memories.flatMap(m => JSON.parse(m.tags || '[]')))];

  const moodCounts = {};
  memories.forEach(m => {
    if (m.mood) moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
  });
  const dominantMood = Object.entries(moodCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  const lowercaseMsg = message.toLowerCase();

  if (lowercaseMsg.includes('summary') || lowercaseMsg.includes('overview') || lowercaseMsg.includes('recap')) {
    return {
      response: `Here's your memory overview, ${user.name}. You've recorded ${memoryCount} memories so far, with your most common mood being "${dominantMood}". Your key topics include: ${tags.slice(0, 8).join(', ') || 'none recorded yet'}. Keep nurturing those moments that matter most.`,
      insights: { memoryCount, dominantMood, topTags: tags.slice(0, 5) }
    };
  }

  if (lowercaseMsg.includes('forget') || lowercaseMsg.includes('forgotten') || lowercaseMsg.includes('remind')) {
    if (recentMemories.length === 0) {
      return {
        response: `${user.name}, you haven't recorded any memories yet. Start by creating your first memory and I'll help you revisit it anytime.`,
        insights: null
      };
    }
    const random = recentMemories[Math.floor(Math.random() * recentMemories.length)];
    return {
      response: `Ah yes, let me remind you! On ${random.created_at?.split('T')[0] || 'a recent day'}, you wrote about "${random.title}". You said: "${random.content?.substring(0, 200)}". Does that bring back the feeling?`,
      insights: { memoryId: random.id, title: random.title, date: random.created_at }
    };
  }

  if (lowercaseMsg.includes('mood') || lowercaseMsg.includes('feeling') || lowercaseMsg.includes('emotion')) {
    return {
      response: `Looking at your memory patterns, ${user.name}, your predominant mood has been "${dominantMood}". You've shared ${memoryCount} moments. The moods you've expressed are: ${Object.entries(moodCounts).map(([m, c]) => `${m} (${c}x)`).join(', ') || 'none yet'}. How are you feeling right now?`,
      insights: { moodDistribution: moodCounts, dominantMood }
    };
  }

  if (lowercaseMsg.includes('suggest') || lowercaseMsg.includes('idea') || lowercaseMsg.includes('what should')) {
    return {
      response: `${user.name}, based on your memory themes (${tags.slice(0, 5).join(', ') || 'various topics'}), here's an idea: try recording a sensory memory today — a smell, a sound, a texture. Those often unlock the deepest emotions. What's one small beautiful thing that happened in the last 24 hours?`,
      insights: { suggestion: 'Record a sensory memory', basedOnTags: tags.slice(0, 3) }
    };
  }

  if (lowercaseMsg.includes('hello') || lowercaseMsg.includes('hi') || lowercaseMsg.includes('hey')) {
    return {
      response: `Hello ${user.name}! I'm your Memory Companion. I'm here to help you explore, preserve, and reflect on your memories. You have ${memoryCount} memory entries. Would you like me to summarize them, suggest a new memory prompt, or help you recall something specific?`,
      insights: { memoryCount }
    };
  }

  const thoughtfulResponses = [
    `${user.name}, that's a beautiful reflection. Your memories are the threads of your story — with ${memoryCount} threads woven so far. Would you like to explore a particular theme or time?`,
    `I hear you, ${user.name}. Your ${memoryCount} memories paint a unique picture. The most common thread I see is "${tags[0] || "life's journey"}". Want to dive deeper into that?`,
    `${user.name}, every memory you keep is a treasure. You've logged ${memoryCount} so far. Is there a specific memory you'd like me to help you revisit or expand upon?`,
    `Thank you for sharing, ${user.name}. Your memory collection spans ${memoryCount} entries with moods like "${dominantMood}". What aspect of your journey would you like to explore today?`
  ];

  return {
    response: thoughtfulResponses[Math.floor(Math.random() * thoughtfulResponses.length)],
    insights: { memoryCount, dominantMood }
  };
}

router.post('/chat', authenticateToken, requireSubscription, apiLimiter, (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: 'Message too long (max 2000 characters)' });
    }

    const memories = db.prepare(
      'SELECT id, title, content, mood, tags, created_at FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 100'
    ).all(req.user.id);

    const result = generateAIResponse(req.user, memories, message.trim());

    res.json(result);
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

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

      if (m.mood) {
        moodTrend.push({ date: m.created_at?.split('T')[0], mood: m.mood });
      }

      const month = m.created_at?.substring(0, 7);
      if (month) monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      insights: {
        totalMemories: memories.length,
        topTags,
        moodTrend,
        monthlyActivity: monthlyCounts,
        mostActiveMonth: Object.entries(monthlyCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null
      }
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
