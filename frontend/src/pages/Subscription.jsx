import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('paypal');
  const [walletInfo, setWalletInfo] = useState(null);
  const [txSig, setTxSig] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [paypalSent, setPaypalSent] = useState(false);

  const isActive = user.subscription_status === 'active';

  // Check for PayPal redirect from payment link
  useEffect(() => {
    const ref = searchParams.get('paypal_ref');
    if (ref === 'return') {
      setPaypalSent(true);
      setSuccess('Payment completed with PayPal. Click "I\'ve Paid" below to activate your subscription.');
    }
  }, []);

  useEffect(() => {
    api.getPaymentMethods().then(d => {
      setMethods(d.methods);
      const preferred = d.methods.find(m => m.id === 'paypal' || m.id === 'dev-free');
      if (preferred) setSelectedMethod(preferred.id);
    }).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setVerifyResult(null);

    try {
      if (selectedMethod === 'paypal') {
        const data = await api.createPaypalOrder();
        if (data.url) {
          sessionStorage.setItem('paypal_order_id', data.orderId);
          window.location.href = data.url;
        } else {
          setError('PayPal is not available');
        }
      } else if (selectedMethod === 'direct-wallet') {
        const data = await api.initiateWalletPayment();
        if (data.success) {
          setWalletInfo(data);
          setSuccess("Send payment to the wallet address below. Funds go directly to the owner's wallet.");
        }
      } else if (selectedMethod === 'dev-free') {
        const data = await api.activateDevFree();
        if (data.success) {
          setSuccess('Subscription activated (dev mode — no payment processed)');
          await refreshUser();
          setTimeout(() => navigate('/dashboard'), 2000);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPaypal = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyPaypalPayment();
      if (result.success) {
        setSuccess('Subscription activated via PayPal!');
        setPaypalSent(false);
        await refreshUser();
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyWallet = async () => {
    if (!txSig.trim()) return;
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyWalletPayment(txSig.trim());
      setVerifyResult(result);
      if (result.confirmed) {
        await refreshUser();
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success && !walletInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center card max-w-md animate-fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Subscription Active</h2>
          <p className="text-gray-400 mb-6">{success}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center card max-w-md animate-fade-in">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Already Active</h2>
          <p className="text-gray-400 mb-6">Your premium subscription is active.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const selected = methods.find(m => m.id === selectedMethod);

  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Unlock Your Memory Journey</h1>
        <p className="text-gray-400 text-lg">Choose your payment method — $9/month</p>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto mb-6 bg-red-600/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {success && walletInfo && (
        <div className="max-w-3xl mx-auto mb-6 bg-brand-600/10 border border-brand-500/20 text-brand-300 text-sm rounded-xl px-4 py-3">
          {success}
        </div>
      )}

      {verifyResult && (
        <div className={`max-w-3xl mx-auto mb-6 rounded-xl px-4 py-3 text-sm ${verifyResult.confirmed ? 'bg-green-600/10 border border-green-500/20 text-green-300' : 'bg-amber-600/10 border border-amber-500/20 text-amber-300'}`}>
          {verifyResult.message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
        <div className="card border-gray-700">
          <h3 className="text-xl font-bold mb-4">Free Trial</h3>
          <div className="text-3xl font-bold mb-4">$0</div>
          <ul className="space-y-3 mb-8">
            {['5 memories', 'Basic storage', 'Demo access'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-400">
                <span className="text-brand-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <div className="text-sm text-gray-500 text-center">Current plan</div>
        </div>

        <div className="card border-brand-500/50 bg-brand-600/5 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 rounded-full text-xs font-semibold">
            Recommended
          </div>
          <h3 className="text-xl font-bold mb-4">Premium</h3>
          <div className="text-3xl font-bold mb-4">$9<span className="text-lg text-gray-400">/mo</span></div>
          <ul className="space-y-3 mb-8">
            {[
              'Unlimited memories',
              'AI Companion chat',
              'Advanced insights & analytics',
              'Mood tracking & patterns',
              'Priority support',
              'Early access to new features'
            ].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm">
                <span className="text-brand-400">✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="space-y-3">
            {methods.map(m => (
              <label
                key={m.id}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === m.id ? 'border-brand-500 bg-brand-600/10' : 'border-gray-800 hover:border-gray-600'}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={selectedMethod === m.id}
                  onChange={() => { setSelectedMethod(m.id); setWalletInfo(null); setVerifyResult(null); setSuccess(''); }}
                  className="accent-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-gray-400">
                    via {m.provider} • {m.fee}
                    {m.supports && m.id === 'direct-wallet' ? ` • Accepts: ${m.supports.join(', ')}` : ''}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${m.fee === '0% — free, direct to wallet' || m.fee === 'Free' ? 'bg-green-900/30 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                  {m.fee}
                </span>
              </label>
            ))}
          </div>
        </div>

        {paypalSent ? (
          <button
            onClick={handleVerifyPaypal}
            disabled={loading}
            className="btn-primary w-full text-lg py-4 animate-pulse-glow"
          >
            {loading ? 'Verifying...' : "I've Paid — Activate Subscription"}
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="btn-primary w-full text-lg py-4 animate-pulse-glow"
          >
            {loading ? 'Processing...' : selected?.id === 'direct-wallet' ? 'Get Wallet Address' : selected?.id === 'dev-free' ? 'Activate Free' : 'Pay with PayPal'}
          </button>
        )}
      </div>

      {walletInfo && (
        <div className="max-w-xl mx-auto mt-6 card border-brand-500/50 bg-brand-600/5">
          <h2 className="text-xl font-semibold mb-4">Send Payment to Wallet</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Wallet Address:</p>
              <div className="input-field text-xs break-all select-all font-mono">{walletInfo.walletAddress}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-400 mb-1">SOL amount:</p>
                <p className="text-lg font-bold">{walletInfo.priceSOL} SOL</p>
              </div>
              <div className="bg-gray-900 rounded-xl p-3">
                <p className="text-gray-400 mb-1">USDC amount:</p>
                <p className="text-lg font-bold">{walletInfo.priceUSDC} USDC</p>
              </div>
            </div>
            {walletInfo.instructions?.reference && (
              <div>
                <p className="text-gray-400 mb-1">Reference (include as memo):</p>
                <div className="input-field text-xs font-mono select-all">{walletInfo.paymentRef}</div>
              </div>
            )}
            <div className="border-t border-gray-800 pt-4">
              <p className="font-medium mb-2">Verify Payment</p>
              <p className="text-gray-400 mb-2">After sending, paste the transaction signature here:</p>
              <div className="flex gap-2">
                <input
                  className="input-field flex-1 text-sm font-mono"
                  placeholder="Transaction signature..."
                  value={txSig}
                  onChange={e => setTxSig(e.target.value)}
                />
                <button
                  onClick={handleVerifyWallet}
                  disabled={loading || !txSig.trim()}
                  className="btn-primary text-sm"
                >
                  {loading ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {user.demo_used === 0 && (
        <div className="text-center mt-6">
          <button onClick={() => navigate('/demo')} className="btn-ghost">
            ← Continue Free Demo First
          </button>
        </div>
      )}
    </div>
  );
}
