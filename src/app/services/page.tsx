import {
  PageHero,
  ServiceGrid,
  CTA,
  FAQ,
  faqs,
  Approach,
  SectionTitle,
} from "@/components/marketing";
import { pricingNote } from "@/config/services";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "DevOps consulting services & pricing",
  "Linux troubleshooting, CI/CD setup, Docker, Kubernetes, monitoring, and managed DevOps support. Explore scope and starting rates.",
  "/services",
);
export default function Services() {
  return (
    <>
      <PageHero
        eyebrow="SERVICES / BUILT AROUND YOUR TEAM"
        title="A practical next step for your infrastructure."
        description="From an urgent Linux investigation to a repeatable deployment workflow, choose focused engineering help with clear deliverables."
      />
      <section className="section pale">
        <div className="wrap">
          <ServiceGrid />
          <p className="pricing-note">
            {pricingNote} Cloud provider and third-party costs are separate
            unless explicitly quoted. Support allocations and communication
            windows are agreed in writing.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <SectionTitle
            eyebrow="FROM FIRST CONVERSATION TO HANDOVER"
            title="No mystery in the process."
          />
          <Approach />
        </div>
      </section>
      <section className="section pale">
        <div className="wrap split">
          <SectionTitle
            eyebrow="COMMON QUESTIONS"
            title="Scope before commitment."
          />
          <FAQ items={faqs} />
        </div>
      </section>
      <CTA />
    </>
  );
}
