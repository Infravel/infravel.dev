import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  GitBranch,
  ShieldCheck,
  FileText,
} from "lucide-react";
import {
  Infrastructure,
  SectionTitle,
  ServiceGrid,
  Approach,
  FAQ,
  faqs,
  CTA,
} from "@/components/marketing";
import { pricingNote } from "@/config/services";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "DevOps & Cloud Infrastructure Engineering",
  "Founder-led DevOps consulting for Linux, CI/CD, Docker, Kubernetes, and monitoring. Clearly scoped projects with transparent starting prices.",
  "/",
);
export default function Home() {
  return (
    <>
      <section className="hero dark">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">
              <span className="status-dot" /> DEVOPS & CLOUD INFRASTRUCTURE
              ENGINEERING
            </p>
            <h1>
              Ship with confidence.
              <br />
              <span>Run with reliability.</span>
            </h1>
            <p className="lead">
              From Linux servers and CI/CD pipelines to Docker, Kubernetes, and
              monitoring, Infravel helps software teams build and operate
              infrastructure that supports growth.
            </p>
            <div className="actions">
              <Link className="button" href="/contact">
                Request a Quote <ArrowUpRight size={18} />
              </Link>
              <Link className="button ghost" href="/services">
                Explore Services <ArrowRight size={18} />
              </Link>
            </div>
            <p className="hero-trust">
              <Check size={15} /> Clearly scoped projects. Practical
              engineering. Remote collaboration.
            </p>
          </div>
          <Infrastructure />
        </div>
        <div className="wrap hero-bottom">
          <span>FROM FIRST DEPLOYMENT TO WHAT’S NEXT</span>
          <span>Built around your team. Engineered for your stack.</span>
        </div>
      </section>
      <section className="capabilities">
        <div className="wrap">
          <p className="eyebrow">THE TOOLS THAT CONNECT YOUR STACK</p>
          <div>
            {[
              "Linux",
              "Docker",
              "Kubernetes",
              "Terraform",
              "Ansible",
              "GitHub Actions",
              "Prometheus",
              "Grafana",
            ].map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <SectionTitle
            eyebrow="LESS FIREFIGHTING. MORE FORWARD MOTION."
            title="Your infrastructure should help you ship."
            description="When operations get in the way of product work, a focused engineering engagement can make the next step clear."
          />
          <div className="problem-list">
            {[
              [
                "01",
                "Releases feel risky",
                "Manual deployments and missing CI/CD automation turn every release into a checklist of uncertainty.",
              ],
              [
                "02",
                "You can’t see what’s going wrong",
                "Linux failures and missing monitoring make small incidents harder to diagnose.",
              ],
              [
                "03",
                "The platform is getting harder to manage",
                "Docker complexity, Kubernetes configuration, and maintenance overhead take time away from building.",
              ],
            ].map(([n, t, d]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section pale">
        <div className="wrap">
          <div className="section-heading">
            <SectionTitle
              eyebrow="PRACTICAL EXPERTISE. CLEAR STARTING POINTS."
              title="The right help for your next challenge."
              description="Focused implementations and ongoing support, with scope agreed before work begins."
            />
            <Link className="text-link" href="/services">
              All services <ArrowUpRight size={17} />
            </Link>
          </div>
          <ServiceGrid />
          <p className="pricing-note">
            {pricingNote} Cloud and third-party costs are separate unless
            quoted.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <SectionTitle
            eyebrow="A DIRECT ENGINEERING PARTNERSHIP"
            title="Work with the person doing the work."
          />
          <div className="grid three values">
            {[
              [
                GitBranch,
                "Practical by design",
                "Tools and architecture chosen for your current needs, budget, and team.",
              ],
              [
                ShieldCheck,
                "Clarity before changes",
                "An agreed scope, access plan, and validation criteria before implementation.",
              ],
              [
                FileText,
                "Knowledge that stays with you",
                "Documented configurations and a useful handover, so your team can operate the result.",
              ],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof GitBranch;
              return (
                <article key={String(title)}>
                  <I size={27} />
                  <h3>{String(title)}</h3>
                  <p>{String(body)}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="section dark">
        <div className="wrap">
          <SectionTitle
            eyebrow="HOW WE WORK"
            title="A clear path from problem to handover."
          />
          <Approach />
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <SectionTitle
            eyebrow="ENGINEERING, MADE CONCRETE"
            title="Understand the architecture behind the work."
            description="Explore annotated reference architectures for delivery pipelines, containers, and monitoring. Clearly labeled technical examples, ready for discussion."
          />
          <div className="reference-preview">
            <span className="pill">REFERENCE ARCHITECTURE</span>
            <h3>A safer path from commit to deployment</h3>
            <div className="mini-flow">
              Commit <ArrowRight size={16} /> Test <ArrowRight size={16} />{" "}
              Release
            </div>
            <p>
              Build once, validate the release, and keep a known-good rollback
              target.
            </p>
            <Link className="text-link" href="/work">
              Explore engineering references <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
      </section>
      <section className="opspilot-teaser dark">
        <div className="wrap split">
          <div>
            <p className="eyebrow">IN DEVELOPMENT / BY INFRAVEL</p>
            <h2>
              Meet OpsPilot<span className="brand-dot">.</span>
            </h2>
            <p className="lead">
              Infrastructure visibility for growing engineering teams.
            </p>
            <p>
              A planned unified view of Linux servers, containers, Kubernetes
              workloads, and application health.
            </p>
            <Link className="button ghost" href="/opspilot">
              Explore OpsPilot <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="signal-visual" aria-hidden="true">
            <div />
            <div />
            <div />
            <ActivityMark />
          </div>
        </div>
      </section>
      <section className="section">
        <div className="wrap split">
          <SectionTitle
            eyebrow="BEFORE WE GET STARTED"
            title="A few things you might be wondering."
          />
          <FAQ items={faqs} />
        </div>
      </section>
      <CTA />
    </>
  );
}
function ActivityMark() {
  return (
    <svg viewBox="0 0 300 100">
      <path
        d="M0 50h70l20-25 30 60 35-75 25 40h120"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
