import { PageHero, SectionTitle, Approach, CTA } from "@/components/marketing";
import { site } from "@/config/site";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "About Infravel",
  "Founder-led infrastructure engineering focused on practical automation, direct collaboration, and documented handover.",
  "/about",
);
export default function About() {
  return (
    <>
      <PageHero
        eyebrow="ABOUT INFRAVEL"
        title="Good infrastructure gives your team room to grow."
        description="Infravel is a founder-led DevOps consulting and cloud infrastructure engineering business. You work directly with the engineer responsible for the implementation."
      />
      <section className="section">
        <div className="wrap split">
          <SectionTitle
            eyebrow="OUR MISSION"
            title="Make reliable infrastructure and deployment automation accessible to growing software teams."
          />
          <div>
            <h3>Practical over fashionable.</h3>
            <p>
              The right solution fits the team that will operate it. We start
              with your existing tools, budget, and constraints, then choose the
              smallest useful change.
            </p>
            <h3>Clear communication is part of the work.</h3>
            <p>
              Expect an agreed scope, explicit assumptions, and documentation of
              the decisions behind your infrastructure.
            </p>
            {site.founder && <p>Founder: {site.founder}</p>}
          </div>
        </div>
      </section>
      <section className="section pale">
        <div className="wrap">
          <SectionTitle
            eyebrow="CORE CAPABILITIES"
            title="From operating systems to delivery systems."
          />
          <div className="grid three">
            {[
              [
                "Linux operations",
                "Service diagnostics, resource investigation, and practical operating procedures.",
              ],
              [
                "Delivery engineering",
                "CI/CD workflows, Docker deployments, and Kubernetes workload configuration.",
              ],
              [
                "Infrastructure automation",
                "Terraform and Ansible approaches suited to repeatable provisioning and configuration.",
              ],
              [
                "Monitoring",
                "Useful metrics, dashboards, alert rules, and operational context.",
              ],
              [
                "Cloud infrastructure",
                "Environment assessment and implementation decisions that account for complexity and cost.",
              ],
              [
                "Technical documentation",
                "Configuration notes, acceptance checks, and handover steps your team can use.",
              ],
            ].map(([t, b]) => (
              <article className="project-card" key={t}>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <h2>Careful work. Clear handover.</h2>
          <Approach />
        </div>
      </section>
      <CTA />
    </>
  );
}
