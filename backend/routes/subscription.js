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

// Creates a Stripe Checkout Session — funds go directly to YOUR Stripe account,
// which you payout to your bank. Set payout schedule in Stripe Dashboard.
router.post('/create-checkout', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      db.prepare(
        "UPDATE users SET subscription_status = 'active', subscription_id = ? WHERE id = ?"
      ).run('dev-free-' + Date.now(), req.user.id);

      return res.json({
        url: null,
        message: 'Subscription activated (dev mode — set STRIPE_SECRET_KEY for real payments)',
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
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/settings?subscription=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:4000'}/settings?subscription=cancelled`,
      metadata: { userId: req.user.id }
    });

    res.json({ url: session.url, success: true });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook — listens for subscription lifecycle events
// REQUIRED: Set STRIPE_WEBHOOK_SECRET in .env from Stripe Dashboard
// Endpoint: POST /api/subscription/webhook
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
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        db.prepare(
          "UPDATE users SET subscription_status = 'active', subscription_id = ? WHERE id = ?"
        ).run(session.subscription, session.metadata.userId);
        console.log(`Subscription activated for user ${session.metadata.userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status;
        db.prepare(
          "UPDATE users SET subscription_status = ? WHERE subscription_id = ?"
        ).run(status, sub.id);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const user = db.prepare(
          'SELECT id FROM users WHERE subscription_id = ?'
        ).get(sub.id);
        if (user) {
          db.prepare(
            "UPDATE users SET subscription_status = 'expired', subscription_id = NULL WHERE id = ?"
          ).run(user.id);
          console.log(`Subscription expired for user ${user.id}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(
            "UPDATE users SET subscription_status = 'active' WHERE subscription_id = ?"
          ).run(invoice.subscription);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          db.prepare(
            "UPDATE users SET subscription_status = 'past_due' WHERE subscription_id = ?"
          ).run(invoice.subscription);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      db.prepare(
        "UPDATE users SET subscription_status = 'cancelled', subscription_id = NULL WHERE id = ?"
      ).run(req.user.id);
      return res.json({ success: true });
    }

    const user = db.prepare(
      'SELECT subscription_id FROM users WHERE id = ? AND subscription_id IS NOT NULL'
    ).get(req.user.id);

    if (!user) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    await stripe.subscriptions.update(user.subscription_id, {
      cancel_at_period_end: true
    });

    db.prepare(
      "UPDATE users SET subscription_status = 'cancelling' WHERE id = ?"
    ).run(req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Status check
router.get('/status', authenticateToken, apiLimiter, (req, res) => {
  res.json({
    subscription: {
      status: req.user.subscription_status,
      isActive: req.user.subscription_status === 'active',
      isTrialing: req.user.subscription_status === 'trial' || req.user.subscription_status === 'trialing',
      isCancelled: req.user.subscription_status === 'cancelled' || req.user.subscription_status === 'expired'
    }
  });
});

export default router;
