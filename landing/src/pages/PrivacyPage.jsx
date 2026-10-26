import React from 'react';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPage({ navigate }) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Back button */}
      <button
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-[#e7b956] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </button>

      <div className="bg-[#1c1a17] border border-[#38342e] rounded-2xl p-6 sm:p-10 shadow-xl space-y-8">
        {/* Header */}
        <div className="border-b border-[#2e2b26] pb-6 space-y-2">
          <div className="flex items-center space-x-2 text-[#e7b956] text-xs font-bold uppercase tracking-wider">
            <Shield size={16} />
            <span>Legal Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-zinc-400">
            Effective Date: September 19, 2026
          </p>
        </div>

        {/* Verbatim Privacy Policy Content */}
        <div className="prose prose-invert max-w-none text-sm text-zinc-300 space-y-6 leading-relaxed">
          <div className="bg-[#24221d] p-4 rounded-xl border border-[#33302a] text-xs space-y-1">
            <p><strong className="text-white">Application Name:</strong> ARCA ("We," "Our," or "Us")</p>
            <p><strong className="text-white">Operated By:</strong> ARCA Budgeting</p>
          </div>

          <p>
            We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our web application.
          </p>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              1. Information We Collect
            </h2>
            <p>
              We collect information that you provide directly to us when creating an account or using our features:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-white">Account Information:</strong> Email address, username, and authentication credentials.
              </li>
              <li>
                <strong className="text-white">Financial and Budgeting Data:</strong> Transaction categories, budget goals, income and expense inputs, and any uploaded receipts or notes you manually enter or scan into the app.
              </li>
              <li>
                <strong className="text-white">Usage Data:</strong> Basic log data regarding how you interact with the app to help us maintain security and performance.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              2. How We Use Your Information
            </h2>
            <p>
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve our budgeting and financial tracking features.</li>
              <li>Authenticate your account and secure your personal data.</li>
              <li>Respond to support requests and communicate important app updates.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              3. Data Storage and Security
            </h2>
            <p>
              Your data is securely stored using modern cloud database infrastructure. We implement industry-standard security measures to protect your financial and personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              4. Third-Party Services
            </h2>
            <p>
              We may utilize trusted third-party service providers (such as hosting platforms, database managers, or authentication tools) to operate ARCA. These providers have access to your information only to perform specific tasks on our behalf and are obligated to protect it. We do not sell your personal or financial data to advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              5. Your Choices and Rights
            </h2>
            <p>
              You have the right to access, update, or delete your account information at any time. If you wish to delete your account and all associated financial records, you can do so through your account settings or by contacting us directly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              6. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated effective date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
