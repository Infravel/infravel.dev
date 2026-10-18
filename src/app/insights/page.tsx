import Link from "next/link";
import { PageHero, CTA } from "@/components/marketing";
import { articles, readingTime } from "@/content/insights";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Infrastructure engineering insights",
  "Practical guides to reliable CI/CD, Linux monitoring, and Docker deployment for growing software teams.",
  "/insights",
);
export default function Insights() {
  return (
    <>
      <PageHero
        eyebrow="INSIGHTS / PRACTICAL ENGINEERING NOTES"
        title="Better systems start with better understanding."
        description="Useful notes on deployment, infrastructure, and operating the software your customers depend on."
      />
      <section className="section">
        <div className="wrap grid three">
          {articles.map((a) => (
            <article className="article-card" key={a.slug}>
              <div className="tag-list">
                {a.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="article-meta">
                <time dateTime={a.published}>15 October 2026</time> ·{" "}
                {readingTime(a)} min read
              </div>
              <h2>
                <Link href={`/insights/${a.slug}`}>{a.title}</Link>
              </h2>
              <p>{a.description}</p>
              <Link className="text-link" href={`/insights/${a.slug}`}>
                Read the article ↗
              </Link>
            </article>
          ))}
        </div>
      </section>
      <CTA />
    </>
  );
}
