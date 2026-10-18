import { PageHero, SectionTitle, FlowDiagram } from "@/components/marketing";
import { InquiryForm } from "@/components/forms";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "OpsPilot — infrastructure visibility, in development",
  "Register interest in OpsPilot, Infravel’s planned monitoring platform for Linux, Docker, Kubernetes, and application health.",
  "/opspilot",
);
export default function OpsPilot() {
  return (
    <>
      <PageHero
        eyebrow="IN DEVELOPMENT / A PRODUCT BY INFRAVEL"
        title="OpsPilot — Infrastructure visibility for growing engineering teams."
        description="OpsPilot is being developed to help engineering teams monitor Linux servers, Docker containers, Kubernetes workloads, and application health from a unified platform."
      >
        <div className="actions">
          <a className="button" href="#early-access">
            Join the early-access list ↗
          </a>
        </div>
      </PageHero>
      <section className="section">
        <div className="wrap">
          <SectionTitle
            eyebrow="THE DIRECTION WE’RE BUILDING TOWARD"
            title="Your infrastructure. A clearer picture."
            description="The following capabilities are planned. OpsPilot is not currently available as a monitoring service; scope and release timing may change."
          />
          <div className="grid three">
            {[
              [
                "Linux server monitoring",
                "Host resource signals and service context.",
              ],
              [
                "Docker monitoring",
                "Visibility into container health and resource usage.",
              ],
              [
                "Kubernetes workload visibility",
                "A view of workload health and deployment state.",
              ],
              [
                "Application health monitoring",
                "Understand whether important application endpoints are responding.",
              ],
              [
                "Alerting",
                "Route meaningful infrastructure signals to the people who need them.",
              ],
              [
                "Future incident analysis",
                "Explore ways to help teams understand the context around incidents.",
              ],
            ].map(([t, d]) => (
              <article className="project-card" key={t}>
                <span className="pill">PLANNED CAPABILITY</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
          <FlowDiagram
            title="Planned conceptual architecture"
            labels={[
              "Infrastructure signals",
              "OpsPilot",
              "Visibility + alerts",
            ]}
          />
        </div>
      </section>
      <section id="early-access" className="section pale">
        <div className="wrap split">
          <div>
            <SectionTitle
              eyebrow="FOLLOW THE BUILD"
              title="Help shape what comes next."
              description="Register your interest to hear about early access. Tell us what infrastructure you operate so we can understand the problems that matter."
            />
            <p className="fine">
              No launch date or access entitlement is promised. OpsPilot will
              have an independent application deployment lifecycle; this page is
              for product information and registration only.
            </p>
          </div>
          <InquiryForm kind="waitlist" />
        </div>
      </section>
    </>
  );
}
