import { Router } from 'express';
import crypto from 'crypto';
import db from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimit.js';
import { getPaymentInfo, generatePaymentRef } from '../services/crypto.js';
import { createOrder, isConfigured as paypalConfigured } from '../services/paypal.js';

const router = Router();

// ─── Available payment methods ──────────────────────────
router.get('/payment-methods', authenticateToken, async (req, res) => {
  const methods = [];

  const paypalOk = await paypalConfigured();
  if (paypalOk) {
    methods.push({
      id: 'paypal',
      name: 'PayPal / Credit Card',
      provider: 'PayPal',
      fee: '~2.9% + fixed fee',
      icon: 'paypal'
    });
  }

  const cryptoInfo = getPaymentInfo();
  if (cryptoInfo.configured) {
    methods.push({
      id: 'direct-wallet',
      name: 'Direct Wallet Transfer (SOL/USDC)',
      provider: 'Self-Custodial (Solana)',
      fee: '0% — free, direct to wallet',
      icon: 'wallet',
      supports: ['SOL', 'USDC'],
      walletAddress: cryptoInfo.address,
      priceSOL: cryptoInfo.priceSOL,
      priceUSDC: cryptoInfo.priceUSDC
    });
  }

  methods.push({
    id: 'dev-free',
    name: 'Activate Free (Dev Mode)',
    provider: 'Development',
    fee: 'Free',
    icon: 'dev'
  });

  res.json({ methods, default: 'paypal' });
});

// ─── 1. PayPal — Redirect to Payment Link ────────────────
router.post('/paypal-create-order', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const order = createOrder();
    if (!order || !order.url) {
      return res.status(500).json({ error: 'Failed to create PayPal order' });
    }

    db.prepare(
      'UPDATE users SET paypal_order_id = ?, payment_method = ? WHERE id = ?'
    ).run(order.id, 'paypal', req.user.id);

    db.prepare(
      `INSERT INTO payment_history (id, user_id, paypal_order_id, amount, currency, status, description)
       VALUES (?, ?, ?, ?, 'usd', 'pending', 'PayPal redirect')`
    ).run(crypto.randomUUID(), req.user.id, order.id, 900);

    res.json({ url: order.url, orderId: order.id, success: true, method: 'paypal' });
  } catch (err) {
    console.error('PayPal order error:', err);
    res.status(500).json({ error: 'Failed to process PayPal' });
  }
});

// ─── 2. PayPal — Verify Payment (manual confirmation) ────
router.post('/paypal-verify', authenticateToken, apiLimiter, (req, res) => {
  const pending = db.prepare(
    `SELECT id FROM payment_history WHERE user_id = ? AND status = 'pending' AND paypal_order_id IS NOT NULL`
  ).get(req.user.id);

  if (!pending) {
    return res.status(400).json({ error: 'No pending PayPal payment found. Start a new payment first.' });
  }

  db.prepare(
    "UPDATE users SET subscription_status = 'active', subscription_id = ?, payment_method = 'paypal' WHERE id = ?"
  ).run('paypal-' + Date.now(), req.user.id);

  db.prepare(
    `UPDATE payment_history SET status = 'completed' WHERE id = ?`
  ).run(pending.id);

  console.log(`PayPal subscription activated for user ${req.user.id}`);

  res.json({ success: true, status: 'active', message: 'Subscription activated!' });
});

// ─── 4. Direct Wallet Payment (Self-Custodial) ──────────
router.post('/wallet-payment', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const cryptoInfo = getPaymentInfo();
    if (!cryptoInfo.configured) {
      return res.status(400).json({ error: 'Wallet not configured — set CRYPTO_WALLET_ADDRESS in .env' });
    }

    const paymentRef = generatePaymentRef();
    db.prepare(
      'UPDATE users SET crypto_wallet = ?, payment_method = ? WHERE id = ?'
    ).run(paymentRef, 'wallet', req.user.id);

    db.prepare(
      `INSERT INTO payment_history (id, user_id, amount, currency, status, description)
       VALUES (?, ?, ?, 'usd', 'pending', ?)`
    ).run(crypto.randomUUID(), req.user.id, 900,
      `Direct wallet payment - Reference: ${paymentRef}`);

    res.json({
      success: true,
      method: 'direct-wallet',
      walletAddress: cryptoInfo.address,
      priceSOL: cryptoInfo.priceSOL,
      priceUSDC: cryptoInfo.priceUSDC,
      paymentRef,
      instructions: {
        sol: `Send exactly ${cryptoInfo.priceSOL} SOL to the address above`,
        usdc: `Send exactly ${cryptoInfo.priceUSDC} USDC (Solana network) to the address above`,
        reference: `Include reference "${paymentRef}" in the transaction memo for automatic verification`,
        network: 'Solana — fast, <$0.001 fee'
      },
      verifyUrl: '/api/subscription/verify-wallet-payment'
    });
  } catch (err) {
    console.error('Wallet payment error:', err);
    res.status(500).json({ error: 'Failed to initiate wallet payment' });
  }
});

// ─── 5. Verify Wallet Payment ───────────────────────────
router.post('/verify-wallet-payment', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const { txSignature } = req.body;
    if (!txSignature) {
      return res.status(400).json({ error: 'Transaction signature required' });
    }

    db.prepare(
      "UPDATE users SET subscription_status = 'pending_verification' WHERE id = ?"
    ).run(req.user.id);

    db.prepare(
      `UPDATE payment_history SET crypto_tx_signature = ?, status = 'verifying'
       WHERE user_id = ? AND status = 'pending'`
    ).run(txSignature, req.user.id);

    const { checkIncomingSOL, checkIncomingUSDC } = await import('../services/crypto.js');
    let amount = await checkIncomingSOL(txSignature) || await checkIncomingUSDC(txSignature);

    if (amount && amount >= 0.04) {
      db.prepare(
        "UPDATE users SET subscription_status = 'active', subscription_id = ?, payment_method = 'wallet' WHERE id = ?"
      ).run('wallet-' + txSignature.slice(0, 16), req.user.id);

      db.prepare(
        `UPDATE payment_history SET status = 'completed', amount = ? WHERE crypto_tx_signature = ?`
      ).run(Math.round(amount * 100), txSignature);

      return res.json({
        success: true,
        status: 'active',
        confirmed: true,
        amount,
        message: `Subscription activated! Received ${amount} SOL/USDC.`
      });
    }

    res.json({
      success: true,
      status: 'verifying',
      confirmed: false,
      message: 'Transaction not yet confirmed on-chain. Check back shortly.'
    });
  } catch (err) {
    console.error('Wallet verification error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── 6. Dev Free Activation (local dev only) ────────────
router.post('/activate-dev', authenticateToken, apiLimiter, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Dev activation not available in production' });
  }
  db.prepare(
    "UPDATE users SET subscription_status = 'active', subscription_id = ?, payment_method = 'dev_free' WHERE id = ?"
  ).run('dev-free-' + Date.now(), req.user.id);

  db.prepare(
    `INSERT INTO payment_history (id, user_id, amount, currency, status, description)
     VALUES (?, ?, 0, 'usd', 'completed', 'Dev mode free activation')`
  ).run(crypto.randomUUID(), req.user.id);

  res.json({ success: true, message: 'Subscription activated (dev mode)' });
});

// ─── 7. Cancel Subscription ─────────────────────────────
router.post('/cancel', authenticateToken, apiLimiter, async (req, res) => {
  try {
    const user = db.prepare(
      'SELECT subscription_id FROM users WHERE id = ? AND subscription_id IS NOT NULL'
    ).get(req.user.id);

    if (!user) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    db.prepare(
      "UPDATE users SET subscription_status = 'cancelled', subscription_id = NULL WHERE id = ?"
    ).run(req.user.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Cancel error:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ─── 8. Status Check ────────────────────────────────────
router.get('/status', authenticateToken, apiLimiter, (req, res) => {
  const user = db.prepare('SELECT subscription_status, payment_method FROM users WHERE id = ?').get(req.user.id);
  res.json({
    subscription: {
      status: user.subscription_status,
      paymentMethod: user.payment_method,
      isActive: user.subscription_status === 'active',
      isTrialing: user.subscription_status === 'trial' || user.subscription_status === 'trialing',
      isCancelled: user.subscription_status === 'cancelled' || user.subscription_status === 'expired',
      isPending: user.subscription_status === 'pending_verification'
    }
  });
});

export default router;
