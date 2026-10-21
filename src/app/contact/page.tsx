import { PageHero } from "@/components/marketing";
import { InquiryForm } from "@/components/forms";
import { bookingUrl, site } from "@/config/site";
import { TrackedLink } from "@/components/analytics";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Request a DevOps project quote",
  "Tell Infravel about your Linux, CI/CD, Docker, Kubernetes, or monitoring project. Get a clearly scoped proposal.",
  "/contact",
);
export default async function Contact({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <PageHero
        eyebrow="LET’S TALK INFRASTRUCTURE"
        title="What would you like to make more reliable?"
        description="Tell us where you are today and what you need next. We’ll review your requirements and follow up about scope, fit, and a practical way forward."
      />
      <section className="section pale">
        <div className="wrap content-grid">
          <InquiryForm
            kind="quote"
            preselected={
              typeof params.service === "string" ? params.service : ""
            }
          />
          <aside>
            <p className="eyebrow">WHAT HAPPENS NEXT</p>
            <h2 style={{ fontSize: 30 }}>A conversation with an engineer.</h2>
            <ol>
              <li>We review your environment and goals.</li>
              <li>We clarify the scope and any access needs.</li>
              <li>You receive a proposal before work begins.</li>
            </ol>
            <p className="fine">
              Remote collaboration for English-speaking teams internationally.
              Response windows and availability are agreed during planning.
            </p>
            {bookingUrl && (
              <TrackedLink
                className="button"
                href={bookingUrl}
                event="booking_click"
              >
                Book a discovery call ↗
              </TrackedLink>
            )}
            {site.email && (
              <p style={{ marginTop: 25 }}>
                <TrackedLink
                  className="text-link"
                  href={`mailto:${site.email}`}
                  event="contact_email_click"
                >
                  {site.email}
                </TrackedLink>
              </p>
            )}
            <p className="notice" style={{ marginTop: 25 }}>
              Keep credentials out of this form. Secure access is arranged after
              scope agreement.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
