import { SiteLayout } from "@/components/SiteLayout";
import { Helmet } from "react-helmet-async";

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <Helmet>
        <title>Privacy Policy - Restnvest</title>
        <meta name="description" content="Restnvest Privacy Policy — how we handle your data, what we collect, and how we protect your privacy." />
        <meta property="og:title" content="Privacy Policy - Restnvest" />
        <meta property="og:description" content="How Restnvest handles your data, what we collect, and how we protect your privacy." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://restnvest.com/privacy" />
      </Helmet>

      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8" data-testid="section-privacy">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2" data-testid="text-privacy-headline">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10" data-testid="text-privacy-date">
            Last updated: February 2026
          </p>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <p>
                Restnvest is committed to protecting your privacy. This policy describes what information we collect, how we use it, and what choices you have. We believe in transparency and keeping things simple.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Information We Collect</h2>
              
              <h3 className="text-sm font-semibold text-foreground">Information you provide</h3>
              <p>
                Restnvest does not require account creation. If you voluntarily provide your email address (e.g., for waitlist signup or scheduled research reminders), we store it securely and use it only for the purpose you specified.
              </p>

              <h3 className="text-sm font-semibold text-foreground">Automatically collected information</h3>
              <p>We may collect limited analytics data to understand how the Service is used, including:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Page views and general usage patterns (via Google Analytics)</li>
                <li>Device type and browser information</li>
                <li>Approximate geographic location (country/region level)</li>
              </ul>
              <p>
                We do not track which specific companies you research. We do not build personal profiles based on your investment interests.
              </p>

              <h3 className="text-sm font-semibold text-foreground">Information we do NOT collect</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Financial account information</li>
                <li>Brokerage or portfolio data</li>
                <li>Social security numbers or government IDs</li>
                <li>Detailed personal demographics</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">How We Use Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Provide and improve the Service</li>
                <li>Send communications you've opted into (research reminders, product updates)</li>
                <li>Understand aggregate usage patterns to guide product development</li>
                <li>Ensure the security and stability of the Service</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Data Storage and Security</h2>
              <p>
                Company analyses are generated in real-time and are not permanently stored on our servers. Research session data stays in your browser's local storage. Email addresses provided for waitlist or reminder features are stored securely in our database.
              </p>
              <p>
                We implement reasonable security measures to protect any personal information we hold. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Third-Party Services</h2>
              <p>Restnvest uses the following third-party services:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>SEC EDGAR</strong> — for accessing public company filings</li>
                <li><strong>OpenAI</strong> — for AI-powered document analysis</li>
                <li><strong>Google Analytics</strong> — for aggregate usage analytics</li>
              </ul>
              <p>
                Each of these services has their own privacy policies. We do not share personal information with third parties for marketing purposes.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Cookies</h2>
              <p>
                Restnvest uses minimal cookies and local storage for functional purposes such as theme preference (light/dark mode) and session data. Google Analytics may set cookies for usage tracking. You can disable cookies in your browser settings.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Request deletion of any email address you've provided</li>
                <li>Opt out of any communications</li>
                <li>Access information we hold about you</li>
                <li>Clear your local browser data at any time</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Children's Privacy</h2>
              <p>
                Restnvest is not intended for use by anyone under the age of 18. We do not knowingly collect information from children.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice on the Service. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              <p>
                If you have questions about this Privacy Policy or want to exercise your rights, please contact us at{" "}
                <a href="mailto:product@restnvest.com" className="text-primary hover:underline">
                  product@restnvest.com
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
