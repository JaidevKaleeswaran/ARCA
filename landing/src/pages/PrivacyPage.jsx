import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage({ navigate }) {
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
            Legal Documentation
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950">
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-zinc-500 tabular-nums">
            Last updated: November 14, 2026
          </p>
        </div>

        {/* Verbatim Privacy Policy Content */}
        <div className="text-xs sm:text-sm text-zinc-600 space-y-6 leading-relaxed">
          <div className="rounded-md border border-zinc-200/80 bg-[#F8F8F7] p-3.5 text-xs font-mono space-y-1">
            <p><strong className="text-zinc-950">Application Name:</strong> ARCA (&quot;We,&quot; &quot;Our,&quot; or &quot;Us&quot;)</p>
            <p><strong className="text-zinc-950">Operated By:</strong> <span className="text-zinc-900">ARCA Budgeting</span></p>
          </div>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              1. Who We Are
            </h2>
            <p>
              ARCA Budgeting (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;) operates ARCA (the &quot;App&quot;), an AI-powered budgeting app. This Privacy Policy explains what information we collect, how we use it, who we share it with, and the choices you have. Questions? Contact us at ARCAbudgeting@gmail.com.
            </p>
            <p>
              By using the App, you agree to this Privacy Policy. If you do not agree, please do not use the App.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              2. Who Can Use the App
            </h2>
            <p>
              The App is intended for people aged 13 and older. We do not knowingly collect personal information from children under 13. If you are under 18, you should use the App only with the permission of a parent or legal guardian. If we learn that we collected information from a child under 13, we will delete it. If you believe a child under 13 has given us information, contact us at ARCAbudgeting@gmail.com.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              3. Information We Collect
            </h2>

            <h3 className="text-xs font-semibold text-zinc-900 pt-1">Information you give us</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-900">Account information:</strong> name or nickname, email address, password (stored in hashed form), and your date of birth or age confirmation.</li>
              <li><strong className="text-zinc-900">Budgeting and transaction data:</strong> transactions, amounts, categories, merchants, budgets, goals, and notes that you enter or approve.</li>
              <li><strong className="text-zinc-900">Voice input:</strong> if you use the microphone feature to log a transaction, we process your audio to convert it into text and a transaction entry. We delete the audio immediately after it is transcribed. We keep only the resulting transaction details.</li>
              <li><strong className="text-zinc-900">Receipt images:</strong> if you use the receipt scanner, we process the image to extract items, totals, dates, and merchants. We delete receipt images immediately after they are processed. We keep only the transaction details extracted from them.</li>
              <li><strong className="text-zinc-900">AI assistant conversations:</strong> the questions you ask the AI financial assistant and its responses.</li>
              <li>Support messages and feedback you send us.</li>
            </ul>

            <h3 className="text-xs font-semibold text-zinc-900 pt-1">Information collected automatically</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-900">Device and usage information:</strong> device type, operating system, browser, IP address, language, pages and features used, crash reports, and timestamps.</li>
              <li><strong className="text-zinc-900">Cookies and similar technologies:</strong> we do not use advertising or analytics cookies. We use browser storage only to keep you signed in. See Section 8.</li>
            </ul>

            <h3 className="text-xs font-semibold text-zinc-900 pt-1">Information from third parties</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>We do not currently connect to your bank accounts or receive data from banks.</li>
              <li>Market data providers send us market information. We do not send them your personal financial data.</li>
            </ul>

            <h3 className="text-xs font-semibold text-zinc-900 pt-1">Permissions</h3>
            <p>
              The App will ask for permission to use your microphone and camera. You can decline or revoke these permissions in your device or browser settings. Some features will not work without them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              4. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, operate, and maintain the App, including logging transactions, categorizing spending, and generating budgets and insights.</li>
              <li>Power the AI financial assistant and personalize its responses to your data.</li>
              <li>Convert voice input and receipt images into transaction entries.</li>
              <li>Display market data.</li>
              <li>Create and secure your account, and prevent fraud and abuse.</li>
              <li>Communicate with you about your account, updates, and support requests.</li>
              <li>Send product updates or marketing messages, where permitted. You can opt out at any time.</li>
              <li>Analyze usage and improve the App.</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <p>
              <strong className="text-zinc-900">AI training:</strong> We do not use your personal financial data, voice recordings, receipt images, or AI conversations to train AI models. Our AI provider is Google (Gemini). Google processes the information we send it under Google&apos;s own terms and privacy practices, which we do not control.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              5. How We Share Information
            </h2>
            <p>
              We do not sell your personal information, and we do not share it for cross-context behavioral advertising.
            </p>
            <p>We share information only in these situations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-zinc-900">Service providers</strong> who help us run the App, under confidentiality and data-protection obligations. These include: hosting (Vercel), database and user authentication (Google Firebase, including Firestore and Firebase Authentication), and AI processing, including converting voice to text and reading receipts (Google Gemini).</li>
              <li><strong className="text-zinc-900">Legal and safety reasons:</strong> to comply with law, respond to lawful requests, enforce our Terms, or protect the rights, safety, and security of users, us, or others.</li>
              <li><strong className="text-zinc-900">Business transfers:</strong> if we are involved in a merger, acquisition, financing, or sale of assets, your information may be transferred. We will notify you of any change in ownership or use of your information.</li>
              <li><strong className="text-zinc-900">With your direction:</strong> when you ask us to share information or give us consent.</li>
            </ul>
            <p>
              We may share aggregated or de-identified information that cannot reasonably be used to identify you.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              6. How Long We Keep Information
            </h2>
            <p>
              We keep your information while your account is active and as needed to provide the App. If you ask us to delete your account by emailing ARCAbudgeting@gmail.com, we will delete your personal information within 30 days, except where we must keep certain records to meet legal, security, or dispute-resolution obligations. We do not keep backups of voice audio or receipt images, since they are deleted right after processing. Your account and budgeting data is stored in our database (Google Firestore).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              7. Your Choices and Rights
            </h2>
            <p>You can:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access and update your account information and transactions in the App.</li>
              <li>Delete your account and data by emailing ARCAbudgeting@gmail.com. We do not yet offer in-app account deletion.</li>
              <li>Export a copy of your data by emailing ARCAbudgeting@gmail.com. We do not yet offer in-app export.</li>
              <li>Opt out of marketing emails using the unsubscribe link.</li>
              <li>Revoke microphone, camera, or bank-connection permissions at any time.</li>
            </ul>
            <p>
              <strong className="text-zinc-900">US state privacy rights.</strong> Depending on where you live (including California, Colorado, Connecticut, Virginia, Texas, and other states), you may have the right to know what personal information we collect, access it, correct it, delete it, receive a copy, and not be discriminated against for exercising these rights. To make a request, email ARCAbudgeting@gmail.com. We may need to verify your identity. You may use an authorized agent, and you may appeal a denial by replying to our decision.
            </p>
            <p>
              <strong className="text-zinc-900">Users in the EEA, UK, or Switzerland.</strong> Where those laws apply, our legal bases for processing are performance of our contract with you, our legitimate interests (such as security and improving the App), your consent (such as for optional marketing or microphone and camera features), and legal obligations. You may also have the right to object to or restrict processing and to complain to your local data protection authority.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              8. Cookies and Browser Storage
            </h2>
            <p>
              We do not use advertising or analytics cookies, and the App does not ask you to accept cookies. To keep you signed in, our authentication provider (Firebase Authentication) stores a login token in your browser&apos;s local storage. This is strictly necessary for the App to work. You can remove it by signing out or clearing your browser data, after which you will need to sign in again.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              9. Security
            </h2>
            <p>
              We use reasonable safeguards, including encryption in transit, access controls, and encryption at rest provided by our database provider, to protect your information. No system is completely secure, and we cannot guarantee absolute security. Please use a strong, unique password and keep it private. If we learn of a breach affecting your information, we will notify you as required by law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              10. Financial Information and AI
            </h2>
            <p>
              The App provides general budgeting tools and information. AI-generated responses may be inaccurate or incomplete, and are not financial, investment, tax, or legal advice. Please do not enter information you are not comfortable sharing, such as full card numbers, Social Security numbers, or passwords, into the AI assistant or transaction notes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              11. Information for Parents and Guardians
            </h2>
            <p>
              If your teen uses the App, you may contact us at ARCAbudgeting@gmail.com to ask about, review, or delete their information. We recommend discussing what financial information they enter and which permissions they allow.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              12. International Transfers
            </h2>
            <p>
              We and our service providers may process information in the United States and other countries. Where required, we use appropriate safeguards for transfers of personal information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              13. Third-Party Links and Services
            </h2>
            <p>
              The App may link to or integrate third-party services. Their privacy practices are governed by their own policies, and we are not responsible for them.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              14. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the new version with a new &quot;Last updated&quot; date and, for material changes, notify you in the App or by email before they take effect.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-950 border-b border-zinc-100 pb-1.5">
              15. Contact Us
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
