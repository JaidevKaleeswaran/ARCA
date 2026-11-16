import React from 'react';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsPage({ navigate }) {
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
            <FileText size={16} />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-zinc-400">
            Effective Date: September 19, 2026
          </p>
        </div>

        {/* Verbatim Terms Content */}
        <div className="prose prose-invert max-w-none text-sm text-zinc-300 space-y-6 leading-relaxed">
          <div className="bg-[#24221d] p-4 rounded-xl border border-[#33302a] text-xs space-y-1">
            <p><strong className="text-white">Application Name:</strong> ARCA ("We," "Our," or "Us")</p>
            <p><strong className="text-white">Operated By:</strong> ARCA Budgeting</p>
          </div>

          <p>
            By accessing or using ARCA, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
          </p>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              1. Use of the Application
            </h2>
            <p>
              <strong className="text-white">Eligibility:</strong> You must be at least 13 years old to use this application.
            </p>
            <p>
              <strong className="text-white">Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <p>
              <strong className="text-white">Acceptable Use:</strong> You agree not to misuse the application, attempt to bypass its security features, or use it for any unlawful activities.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              2. Financial Disclaimer
            </h2>
            <p>
              <strong className="text-white">Educational and Informational Purposes Only:</strong> ARCA is designed solely to assist you in tracking your personal finances, budgeting, and organizing expenses.
            </p>
            <p>
              ARCA Budgeting is not a financial advisor, broker, or certified public accountant (CPA).
            </p>
            <p>
              The application does not provide professional financial, investment, tax, or legal advice. Any financial decisions you make based on data or insights from this app are strictly your own responsibility.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              3. Intellectual Property
            </h2>
            <p>
              All code, user interface design, graphics, text, and other elements comprising ARCA are the property of ARCA Budgeting and are protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the app for your personal, non-commercial use.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              4. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, ARCA is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. We do not guarantee that the application will be uninterrupted, error-free, or completely secure. ARCA Budgeting shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the app or loss of financial data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              5. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your access to the application at any time, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white border-b border-[#2e2b26] pb-1.5">
              6. Changes to Terms
            </h2>
            <p>
              We may modify these Terms of Service at any time. Continued use of the application after any modifications indicates your acceptance of the updated terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
