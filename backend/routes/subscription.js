import { Router } from 'express';
import Stripe from 'stripe';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  return new Stripe(key);
}

router.post('/create-checkout', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      db.prepare(
        'UPDATE users SET subscription_status = ?, subscription_id = ? WHERE id = ?'
      ).run('active', 'dev-free-' + Date.now(), req.user.id);

      return res.json({
        url: null,
        message: 'Subscription activated (dev mode)',
        success: true
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }],
      customer_email: req.user.email,
      success_url: `${process.env.FRONTEND_URL}/settings?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?subscription=cancelled`,
      metadata: { userId: req.user.id }
    });

    res.json({ url: session.url, success: true });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(200).json({ received: true });

  try {
    const sig = req.headers['stripe-signature'];
    const payload = req.body;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        typeof payload === 'string' ? payload : JSON.stringify(payload),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      db.prepare(
        'UPDATE users SET subscription_status = ?, subscription_id = ? WHERE id = ?'
      ).run('active', session.subscription, session.metadata.userId);
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const user = db.prepare(
        'SELECT id FROM users WHERE subscription_id = ?'
      ).get(subscription.id);
      if (user) {
        db.prepare(
          'UPDATE users SET subscription_status = ?, subscription_id = NULL WHERE id = ?'
        ).run('expired', user.id);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.get('/status', authenticateToken, apiLimiter, (req, res) => {
  res.json({
    subscription: {
      status: req.user.subscription_status,
      isActive: req.user.subscription_status === 'active',
      isTrialing: req.user.subscription_status === 'trial' || req.user.subscription_status === 'trialing'
    }
  });
});

export default router;
