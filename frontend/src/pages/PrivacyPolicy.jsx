import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6 max-w-3xl mx-auto">
      <Link to="/signup" className="text-brand-400 hover:text-brand-300 text-sm mb-6 inline-block">&larr; Back</Link>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Last updated: May 31, 2026</p>

      <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Data We Collect</h2>
          <p>We collect the following data to provide and improve our Service:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Account Data:</strong> Name, email address, and encrypted password</li>
            <li><strong>Memory Content:</strong> Titles, descriptions, mood tags, and any content you choose to record</li>
            <li><strong>Usage Data:</strong> Login timestamps, feature interactions, and session duration</li>
            <li><strong>Payment Data:</strong> Stripe handles all payment processing. We never see or store your card details. Stripe's privacy policy applies to payment data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide and maintain the memory journal service</li>
            <li>Power AI features (memory analysis, insights, conversation)</li>
            <li>Process subscription payments via Stripe</li>
            <li>Send essential service communications (billing, security notices)</li>
            <li>Improve the Service based on aggregate usage patterns</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Data Storage and Security</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>All data is stored encrypted at rest using SQLite with WAL mode</li>
            <li>Passwords are hashed using bcrypt with 12 rounds of salting</li>
            <li>Authentication uses JWT tokens with server-side session tracking</li>
            <li>API communications use HTTPS in production</li>
            <li>Brute-force protection locks accounts after 5 failed attempts</li>
            <li>Rate limiting prevents API abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. AI Processing</h2>
          <p>Our AI Companion analyzes your memory content to generate insights, summaries, and conversational responses. This analysis is performed server-side using rule-based algorithms. Memory content is not shared with third-party AI providers. In future updates, if external AI APIs are used, only anonymized and aggregated data will be transmitted.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data Sharing</h2>
          <p>We do not sell, rent, or trade your personal data. We only share data with:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Stripe:</strong> For payment processing (your email and subscription details)</li>
            <li><strong>Legal authorities:</strong> If required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Your Rights (GDPR / CCPA)</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Access:</strong> Export all your data in JSON format (Settings &rarr; Export Data)</li>
            <li><strong>Rectification:</strong> Update your account information anytime</li>
            <li><strong>Erasure:</strong> Delete your account and all associated data (Settings &rarr; Delete Account)</li>
            <li><strong>Portability:</strong> Download a complete copy of your memories</li>
            <li><strong>Withdraw consent:</strong> Cancel your subscription at any time</li>
          </ul>
          <p className="mt-2">To exercise any of these rights, visit your Settings page or contact us at <span className="text-brand-400">privacy@memory-companion.app</span></p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Data Retention</h2>
          <p>We retain your data for as long as your account is active. Upon account deletion, all associated data is permanently removed within 30 days. Backup copies may persist for up to 90 days before complete erasure.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">8. Cookies</h2>
          <p>We use essential cookies for authentication (session tokens) and functionality. No tracking cookies or third-party analytics cookies are used. You cannot opt out of essential cookies as they are required for the Service to function.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">9. Children's Privacy</h2>
          <p>The Service is not intended for users under 13 years of age. We do not knowingly collect data from children. If we discover a child's account, it will be promptly deleted.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">10. Changes to This Policy</h2>
          <p>We will notify users of material changes via email and in-app notice. Continued use after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
          <p>Data Controller: Memory Companion<br/>
          Email: <span className="text-brand-400">privacy@memory-companion.app</span><br/>
          Data Protection inquiries: <span className="text-brand-400">dpo@memory-companion.app</span></p>
        </section>
      </div>
    </div>
  );
}
