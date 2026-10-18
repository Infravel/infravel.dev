import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, readingTime } from "@/content/insights";
import { PageHero, CTA } from "@/components/marketing";
import { site } from "@/config/site";
import { metadata as meta } from "@/lib/seo";
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) return {};
  const m = meta(a.title, a.description, `/insights/${a.slug}`);
  return {
    ...m,
    openGraph: {
      ...m.openGraph,
      type: "article",
      publishedTime: a.published,
      modifiedTime: a.updated,
      tags: a.tags,
    },
  };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageHero
        eyebrow={`INSIGHTS / ${a.tags[0].toUpperCase()}`}
        title={a.title}
        description={a.description}
      />
      <section className="section">
        <article className="wrap narrow content-body">
          <p className="article-meta">
            Published <time dateTime={a.published}>15 October 2026</time> ·
            Updated <time dateTime={a.updated}>15 October 2026</time> ·{" "}
            {readingTime(a)} min read{site.founder ? ` · ${site.founder}` : ""}
          </p>
          {a.sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {s.code && (
                <pre>
                  <code>{s.code}</code>
                </pre>
              )}
            </section>
          ))}
          <h2>Technical references</h2>
          <ul>
            {a.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.title} ↗
                </a>
              </li>
            ))}
          </ul>
          <h2>Keep reading</h2>
          <ul>
            {articles
              .filter((x) => x.slug !== a.slug)
              .map((x) => (
                <li key={x.slug}>
                  <Link href={`/insights/${x.slug}`}>{x.title}</Link>
                </li>
              ))}
          </ul>
        </article>
      </section>
      <CTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.description,
            datePublished: a.published,
            dateModified: a.updated,
            mainEntityOfPage: site.url + `/insights/${a.slug}`,
            publisher: {
              "@type": "Organization",
              name: site.name,
              url: site.url,
            },
          }),
        }}
      />
    </>
  );
}
