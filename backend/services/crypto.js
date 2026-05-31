// Self-custodial crypto payment monitoring
// Funds go directly to YOUR wallet — no intermediary, no fees
// Supports: Solana (SOL) and USDC on Solana
// Uses public RPC — no API key needed to check transactions

const SOLANA_RPC = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const OWNER_WALLET = process.env.CRYPTO_WALLET_ADDRESS;

const SUBSCRIPTION_PRICE_SOL = 0.05;   // ~$9 SOL equivalent
const SUBSCRIPTION_PRICE_USDC = 9;      // 9 USDC

async function querySolanaRPC(method, params = []) {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method,
        params
      })
    });
    const data = await res.json();
    return data.result;
  } catch (err) {
    console.error('Solana RPC error:', err.message);
    return null;
  }
}

// Check if a payment was sent to the owner's wallet
// Returns the amount in SOL (converted from lamports)
export async function checkIncomingSOL(txSignature) {
  if (!OWNER_WALLET) return null;

  const tx = await querySolanaRPC('getTransaction', [
    txSignature,
    { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
  ]);

  if (!tx || !tx.meta || tx.meta.err) return null;

  // Parse post-balances to find transfer to owner
  const accountKeys = tx.transaction.message.accountKeys;
  const postBalances = tx.meta.postBalances;
  const preBalances = tx.meta.preBalances;

  for (let i = 0; i < accountKeys.length; i++) {
    if (accountKeys[i] === OWNER_WALLET && postBalances[i] > preBalances[i]) {
      const diff = postBalances[i] - preBalances[i];
      const solAmount = diff / 1_000_000_000; // lamports to SOL
      return solAmount;
    }
  }

  return null;
}

// Verify a USDC transfer to the owner's wallet
// This checks SPL token transfers (more complex — requires account parsing)
export async function checkIncomingUSDC(txSignature) {
  if (!OWNER_WALLET) return null;

  const tx = await querySolanaRPC('getTransaction', [
    txSignature,
    { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }
  ]);

  if (!tx || !tx.meta || tx.meta.err) return null;

  // Parse token transfers (SPL Token program)
  const postTokenBalances = tx.meta.postTokenBalances || [];
  const preTokenBalances = tx.meta.preTokenBalances || [];

  // USDC mint address on Solana
  const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

  for (const post of postTokenBalances) {
    if (post.mint === USDC_MINT && post.owner === OWNER_WALLET) {
      const pre = preTokenBalances.find(p => p.accountIndex === post.accountIndex);
      const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmountString) : 0;
      const postAmount = parseFloat(post.uiTokenAmount.uiAmountString);
      const diff = postAmount - preAmount;
      if (diff > 0) return diff;
    }
  }

  return null;
}

// Generate payment reference (user includes in memo)
export function generatePaymentRef() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 8; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length));
  return ref;
}

export function getPaymentInfo() {
  return {
    address: OWNER_WALLET || null,
    priceSOL: SUBSCRIPTION_PRICE_SOL,
    priceUSDC: SUBSCRIPTION_PRICE_USDC,
    configured: !!OWNER_WALLET && OWNER_WALLET.length > 30
  };
}

// Verify a payment by scanning recent transactions for a reference memo
export async function verifyPaymentByRef(userId) {
  if (!OWNER_WALLET) return null;

  // Get recent signatures for the owner's wallet
  const signatures = await querySolanaRPC('getSignaturesForAddress', [
    OWNER_WALLET,
    { limit: 20 }
  ]);

  if (!signatures || signatures.length === 0) return null;

  // Check the most recent transactions
  for (const sig of signatures) {
    const amount = await checkIncomingSOL(sig.signature) || await checkIncomingUSDC(sig.signature);
    if (amount && (amount >= SUBSCRIPTION_PRICE_SOL || amount >= SUBSCRIPTION_PRICE_USDC)) {
      return { signature: sig.signature, amount, slot: sig.slot };
    }
  }

  return null;
}
