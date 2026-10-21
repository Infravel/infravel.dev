import Link from "next/link";
import { notFound } from "next/navigation";
import { services, price, pricingNote, quoteUrl } from "@/config/services";
import { site } from "@/config/site";
import { PageHero, Approach, FAQ, FlowDiagram } from "@/components/marketing";
import { PageEvent } from "@/components/analytics";
import { metadata as meta } from "@/lib/seo";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  return s ? meta(s.name, s.overview, `/services/${slug}`) : {};
}
export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <>
      <PageEvent event="service_view" service={s.slug} />
      <PageHero
        eyebrow="DEVOPS SERVICES"
        title={s.name}
        description={s.overview}
      >
        <div className="actions">
          <Link className="button" href={quoteUrl(s.slug)}>
            Request a Quote ↗
          </Link>
          <Link className="button ghost" href="/services">
            All services
          </Link>
        </div>
      </PageHero>
      <section className="section">
        <div className="wrap content-grid">
          <div className="content-body">
            <h2>When this is the right fit</h2>
            <p>{s.problem}</p>
            <FlowDiagram
              labels={s.diagram}
              title={`${s.name} · conceptual flow`}
            />
            <h2>Scope & deliverables</h2>
            <p>
              The final scope is agreed after assessment. A typical engagement
              can include:
            </p>
            <ul>
              {s.deliverables.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <div className="tag-list">
              {s.tools.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <h2>What is not included</h2>
            <p>
              Cloud provider bills, software licenses, major application
              rewrites, and work outside the agreed scope are excluded unless
              explicitly quoted. Production access and changes require an agreed
              access and change plan.
            </p>
            <p>
              {s.monthly
                ? "Support is limited to an agreed monthly allocation and communication window. Unused time, overages, and renewal conditions are set in the proposal."
                : "Ongoing maintenance and incident response are separate engagements."}{" "}
              No 24/7 availability, unlimited work, guaranteed uptime, or
              guaranteed resolution time is included.
            </p>
            <h2>Questions about this service</h2>
            <FAQ
              items={[
                [
                  `What do you need to assess ${s.name.toLowerCase()}?`,
                  "Share your environment, the problem, and the desired result. Do not send passwords, private keys, or sensitive customer data. We arrange secure access after agreeing the scope.",
                ],
                [
                  "What happens if the issue needs more work?",
                  "We explain the findings and agree on any revised scope before additional paid work. An investigation may identify application or provider issues outside the original engagement.",
                ],
                [
                  "How long does it take?",
                  "Timing depends on access, environment complexity, and the agreed deliverables. The proposal includes a delivery plan; starting prices do not imply a guaranteed turnaround.",
                ],
              ]}
            />
          </div>
          <aside className="aside-card">
            <p className="eyebrow">A CLEAR STARTING POINT</p>
            <div className="price">{price(s)}</div>
            <p>Introductory starting rate</p>
            <Link className="button" href={quoteUrl(s.slug)}>
              Request a Quote ↗
            </Link>
            <p className="fine">{pricingNote}</p>
            <p className="fine">
              Cloud provider costs are separate unless explicitly quoted.
            </p>
          </aside>
        </div>
      </section>
      <section className="section pale">
        <div className="wrap">
          <h2>Your engagement, step by step.</h2>
          <Approach />
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.overview,
            url: `${site.url}/services/${s.slug}`,
            provider: {
              "@type": "Organization",
              name: site.name,
              url: site.url,
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "USD",
              price: s.price,
              description: `Introductory starting rate${s.monthly ? " per month" : ""}. Final pricing depends on scope.`,
            },
          }),
        }}
      />
    </>
  );
}
