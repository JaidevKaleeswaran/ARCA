import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage({ navigate }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          navigate('/');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>Back to overview</span>
      </button>

      <div className="rounded-lg border border-zinc-200/80 bg-white p-6 sm:p-10 space-y-8">
        {/* Header */}
        <div className="border-b border-zinc-200/80 pb-6 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Legal Agreement
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-zinc-500 tabular-nums">
            Last updated: November 14, 2026
          </p>
        </div>

        {/* Verbatim Terms Content */}
        <div className="text-xs sm:text-sm text-zinc-600 space-y-6 leading-relaxed">
          <div className="rounded-md border border-zinc-200/80 bg-[#F8F8F7] p-3.5 text-xs font-mono space-y-1">
            <p><strong className="text-zinc-950">Application Name:</strong> ARCA (&quot;We,&quot; &quot;Our,&quot; or &quot;Us&quot;)</p>
            <p><strong className="text-zinc-950">Operated By:</strong> <span className="text-zinc-900">ARCA Budgeting</span></p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              1. Agreement to These Terms
            </h2>
            <p>
              These Terms of Service (&quot;Terms&quot;) are a binding agreement between you and ARCA Budgeting (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) governing your use of ARCA (the &quot;App&quot;), including our website, AI financial assistant, voice transaction input, receipt scanner, market data features, and any related services (together, the &quot;Service&quot;). By creating an account or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              2. Eligibility
            </h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18 (or the age of majority where you live), you may use the Service only with the permission of a parent or legal guardian, who agrees to these Terms on your behalf and is responsible for your use. By using the Service, you confirm that you meet these requirements and that the information you give us is accurate.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              3. Your Account
            </h2>
            <p>
              You are responsible for keeping your login credentials secure and for all activity under your account. Tell us promptly at ARCAbudgeting@gmail.com if you suspect unauthorized use. We may suspend or close accounts that contain false information or violate these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              4. What the Service Does
            </h2>
            <p>
              The Service helps you track spending, create budgets, and learn about personal finance. Features include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-900">AI financial assistant:</strong> answers questions and gives suggestions based on information you provide.</li>
              <li><strong className="text-zinc-900">Voice input:</strong> converts speech into transaction entries.</li>
              <li><strong className="text-zinc-900">Receipt scanner:</strong> extracts details from photos of receipts.</li>
              <li><strong className="text-zinc-900">Market data:</strong> displays information about financial markets.</li>
            </ul>
            <p>We may add, change, or remove features at any time.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              5. Not Financial Advice
            </h2>
            <p>
              The Service is for general information and education only. It is not financial, investment, tax, legal, or accounting advice, and we are not a bank, broker-dealer, investment adviser, or financial planner.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-900">AI limitations:</strong> AI-generated responses can be wrong, incomplete, or out of date, and may misread voice input or receipts. Check entries and suggestions before relying on them.</li>
              <li><strong className="text-zinc-900">Market data:</strong> Market information may be delayed, inaccurate, or incomplete, comes from third parties, and is provided for informational purposes only. It is not a recommendation to buy, sell, or hold any security or asset. Investing involves risk, including loss of principal. Past performance does not guarantee future results.</li>
              <li><strong className="text-zinc-900">Your decisions are yours.</strong> You are solely responsible for your financial decisions. Consider talking to a qualified professional, and for teens, a parent or guardian, before making significant financial choices.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              6. Your Content and Permissions
            </h2>
            <p>
              &quot;Your Content&quot; means the information you submit, including transactions, notes, voice input, receipt images, and messages to the AI assistant. You keep ownership of Your Content. You give us a limited, worldwide, non-exclusive license to host, process, and use Your Content only as needed to operate, secure, and improve the Service, as described in our Privacy Policy.
            </p>
            <p>
              You promise that you have the right to submit Your Content and that it does not violate any law or anyone else&apos;s rights. Please do not upload receipts or recordings that contain other people&apos;s sensitive information, and do not enter full card numbers, Social Security numbers, or passwords.
            </p>
            <p>
              The microphone and camera features work only with your permission, which you can withdraw at any time in your device settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              7. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Break the law or use the Service for fraud, money laundering, or other illegal activity.</li>
              <li>Access the Service by unauthorized means, probe for vulnerabilities, or interfere with its operation or security.</li>
              <li>Scrape, copy, reverse engineer, or resell the Service or its data, except as the law allows.</li>
              <li>Use the AI assistant to generate harmful, deceptive, or abusive content, or attempt to bypass its safeguards.</li>
              <li>Share your account, impersonate others, or submit another person&apos;s information without permission.</li>
              <li>Use the Service to harm minors or violate anyone&apos;s privacy.</li>
              <li>Use automated tools to overload the Service.</li>
            </ul>
            <p>We may investigate violations and take action, including removing content and suspending accounts.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              8. Fees and Subscriptions
            </h2>
            <p>
              ARCA is currently in beta and is free to use. We plan to add premium tiers in the future. Before you are charged anything, we will tell you the pricing, billing cycle, renewal, cancellation, and refund terms, and we will update these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              9. Third-Party Services
            </h2>
            <p>
              The Service relies on third parties, such as hosting, AI, speech and image processing, and market data providers. Their services may have their own terms. We are not responsible for third-party services, content, or outages.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              10. Our Intellectual Property
            </h2>
            <p>
              The Service, including its software, design, text, graphics, and branding, belongs to us or our licensors and is protected by law. We give you a limited, personal, non-exclusive, non-transferable, revocable license to use the Service as allowed by these Terms. If you send us feedback or ideas, we may use them freely without obligation to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              11. Termination
            </h2>
            <p>
              You can stop using the Service and delete your account at any time from Settings or by emailing ARCAbudgeting@gmail.com. We may suspend or end your access at any time, including if you violate these Terms or if we discontinue the Service. After termination, sections that by their nature should survive (such as ownership, disclaimers, liability limits, and dispute terms) will continue to apply.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              12. Disclaimers
            </h2>
            <p className="uppercase text-xs text-zinc-500 leading-relaxed font-mono">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT AI OUTPUTS, TRANSCRIPTIONS, RECEIPT SCANS, OR MARKET DATA WILL BE ACCURATE OR RELIABLE. Some places do not allow certain disclaimers, so some of these may not apply to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              13. Limitation of Liability
            </h2>
            <p className="uppercase text-xs text-zinc-500 leading-relaxed font-mono">
              TO THE FULLEST EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES, OFFICERS, AND CONTRACTORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE, INCLUDING FINANCIAL OR INVESTMENT LOSSES BASED ON INFORMATION FROM THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID US IN THE 12 MONTHS BEFORE THE CLAIM OR US$100. Some places do not allow these limits, so they may not apply to you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              14. Dispute Resolution and Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of California, without regard to conflict-of-law rules. Before filing a claim, please contact us at ARCAbudgeting@gmail.com and give us 30 days to try to resolve the issue informally. Any dispute not resolved informally will be brought in the courts located in Alameda County, California, and you and we consent to that jurisdiction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              15. Changes to These Terms
            </h2>
            <p>
              We may update these Terms. We will post the new version with a new &quot;Last updated&quot; date and, for material changes, notify you in the App or by email. Continuing to use the Service after changes take effect means you accept them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              16. General
            </h2>
            <p>
              These Terms and our Privacy Policy are our entire agreement with you. If any part is found unenforceable, the rest stays in effect. Our failure to enforce a right is not a waiver. You may not transfer these Terms without our consent; we may transfer them in a merger, acquisition, or sale of assets.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              17. Contact Us
            </h2>
            <p>
              ARCA Budgeting<br />
              38442 Fremont Blvd, Fremont, CA 94536<br />
              Email: ARCAbudgeting@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
