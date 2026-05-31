import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <Link to="/signup" className="text-brand-400 hover:text-brand-300 text-sm mb-6 inline-block">&larr; Back</Link>
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: May 31, 2026</p>

      <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By creating an account and using Memory Companion ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
          <p>Memory Companion is an AI-powered personal memory journal that allows users to record, organize, and reflect on their memories. The Service includes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Secure storage of personal memories and reflections</li>
            <li>AI-powered analysis and conversation about stored memories</li>
            <li>Mood tracking and pattern recognition</li>
            <li>Data export and portability tools</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide accurate registration information</li>
            <li>Maintain the confidentiality of your account credentials</li>
            <li>Use the Service in compliance with all applicable laws</li>
            <li>Not upload content that violates any laws or third-party rights</li>
            <li>Not attempt to bypass subscription or security measures</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Subscription and Payments</h2>
          <p>Memory Companion operates on a subscription model:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Free Trial:</strong> Limited to 5 memories for evaluation purposes</li>
            <li><strong>Premium Subscription:</strong> $9/month for unlimited access</li>
            <li>Payments are processed securely through Stripe. We do not store payment card information.</li>
            <li>Subscriptions auto-renew unless cancelled. You can cancel anytime from your Settings page.</li>
            <li>If payment fails, access will be restricted until the account is current.</li>
            <li>Refunds are handled on a case-by-case basis. Contact support within 14 days of payment.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data Ownership</h2>
          <p>You retain full ownership of all memories and content you create. Memory Companion claims no intellectual property rights over your content.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Data Processing</h2>
          <p>We process your memories to provide AI-powered insights and conversation features. Our AI analyzes your memory content locally to identify patterns, moods, and themes. This processing is essential to the core functionality of the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Limitation of Liability</h2>
          <p>Memory Companion is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to data loss, service interruption, or AI-generated inaccuracies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">8. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account and all associated data at any time from your Settings page.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">9. Changes to Terms</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance. We will notify you of material changes via email or in-app notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">10. Contact</h2>
          <p>For questions about these terms, contact: <span className="text-brand-400">support@memory-companion.app</span></p>
        </section>
      </div>
    </div>
  );
}
