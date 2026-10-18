import { PageHero, FlowDiagram, CTA } from "@/components/marketing";
import { work } from "@/config/work";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Engineering reference architectures",
  "Explore annotated delivery, Docker, Kubernetes GitOps, and Linux monitoring reference architectures.",
  "/work",
);
export default function Work() {
  return (
    <>
      <PageHero
        eyebrow="ENGINEERING REFERENCES"
        title="A closer look at how the pieces fit."
        description="Annotated reference architectures for common infrastructure challenges. These conceptual examples explain engineering approaches; they are not client case studies or claims of deployed results."
      />
      <section className="section">
        <div className="wrap">
          <div
            className="grid"
            style={{
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,420px),1fr))",
            }}
          >
            {work.map((w) => (
              <article className="project-card" key={w.title}>
                <span className="pill">{w.type}</span>
                <h2>{w.title}</h2>
                <p>{w.problem}</p>
                <FlowDiagram labels={w.flow} />
                <div className="tag-list">
                  {w.stack.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <h3>Implementation approach</h3>
                <p>{w.summary}</p>
                {w.repository && (
                  <a
                    className="text-link"
                    href={w.repository}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verified repository ↗
                  </a>
                )}
              </article>
            ))}
          </div>
          <p className="notice" style={{ marginTop: 30 }}>
            Public implementation repositories and verified client case studies
            will be added only after review and permission. No outcomes or
            commercial engagements are implied by these references.
          </p>
        </div>
      </section>
      <CTA />
    </>
  );
}
