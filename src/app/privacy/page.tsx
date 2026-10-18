import { PageHero } from "@/components/marketing";
import { site } from "@/config/site";
import Link from "next/link";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Privacy notice",
  "How Infravel handles project inquiries, OpsPilot registrations, security checks, and website analytics.",
  "/privacy",
);
export default function Privacy() {
  return (
    <>
      <PageHero
        eyebrow="PRIVACY / DRAFT FOR BUSINESS REVIEW"
        title="Respect for the information you share."
        description="Updated 15 October 2026. This notice describes the intended MVP data handling. The business owner must confirm contact details, retention, and applicable legal requirements before launch."
      />
      <section className="section">
        <div className="wrap narrow content-body">
          <h2>Information we collect</h2>
          <p>
            A quote request includes your name, email, selected service, project
            description, and optional company, timeline, and budget. OpsPilot
            registration includes email and optional name, company,
            infrastructure interests, and separate marketing consent. Safe
            campaign parameters may be stored with either submission.
          </p>
          <h2>Why we use it</h2>
          <p>
            Infravel uses inquiry information to assess and respond to your
            project and early-access information to communicate about OpsPilot.
            Optional marketing updates require the separate consent recorded on
            the waitlist form. We do not sell inquiry or waitlist information.
          </p>
          <h2>Service providers and storage</h2>
          <p>
            The website and database use Cloudflare Workers and D1. Cloudflare
            Turnstile processes browser and security signals to help prevent
            abuse. Transactional email notifications use Brevo when configured.
            Processing may involve infrastructure outside your country. Do not
            submit passwords, private keys, or sensitive customer records.
          </p>
          <h2>Analytics and browser storage</h2>
          <p>
            Cloudflare Web Analytics may be enabled for aggregate site
            measurements. Conversion events use a fixed event name and optional
            service identifier; form contents and email addresses are excluded.
            Campaign attribution is saved in session storage for this browsing
            session. Conversion tracking respects the browser’s Do Not Track
            setting.
          </p>
          <h2>Security and retention</h2>
          <p>
            Rate limiting stores a salted hash derived from the connecting IP,
            rather than the raw IP, with a ten-minute active window. Expired
            records are deleted by an operational cleanup process. Inquiry and
            waitlist retention must be approved before launch; the proposed
            policy is to review unconverted inquiries after 12 months and remove
            waitlist entries when no longer needed or when requested. Backups
            may retain deleted information until their normal expiry.
          </p>
          <h2>Your choices and requests</h2>
          <p>
            You may request access, correction, deletion, or withdrawal of
            optional marketing consent. Mandatory records may be retained when
            required to fulfil a contract or legal obligation. Use the{" "}
            <Link href="/contact">contact page</Link>
            {site.email ? ` or ${site.email}` : ""} to reach Infravel. A
            verified privacy contact must be configured before public launch.
          </p>
          <h2>Changes</h2>
          <p>
            We will update this notice when the service or its processing
            practices change. Applicable rights and legal bases depend on the
            relevant jurisdiction and require business review.
          </p>
        </div>
      </section>
    </>
  );
}
