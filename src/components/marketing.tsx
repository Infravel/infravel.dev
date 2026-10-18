import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Terminal,
  GitBranch,
  Container,
  Activity,
  Network,
  Cloud,
} from "lucide-react";
import { services, price, quoteUrl, type Service } from "@/config/services";
const icons = [Terminal, GitBranch, Container, Activity, Network, Cloud];
export function ServiceCard({
  service,
  index,
}: {
  service: Service;
  index: number;
}) {
  const Icon = icons[index % icons.length];
  return (
    <article className="service-card">
      <div className="card-top">
        <Icon size={25} />
        <span>0{index + 1}</span>
      </div>
      <h3>
        <Link href={`/services/${service.slug}`}>{service.name}</Link>
      </h3>
      <p>{service.short}</p>
      <ul>
        {service.deliverables.slice(0, 3).map((x) => (
          <li key={x}>
            <Check size={14} />
            {x}
          </li>
        ))}
      </ul>
      <div className="card-bottom">
        <div>
          <span className="fine">Starting at</span>
          <strong>{price(service)}</strong>
        </div>
        <Link
          aria-label={`Request a quote for ${service.name}`}
          className="arrow-button"
          href={quoteUrl(service.slug)}
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </article>
  );
}
export function ServiceGrid() {
  return (
    <div className="grid three">
      {services.map((s, i) => (
        <ServiceCard key={s.slug} service={s} index={i} />
      ))}
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-title">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="page-hero dark">
      <div className="wrap">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        {children}
      </div>
    </section>
  );
}
export function CTA() {
  return (
    <section className="cta dark">
      <div className="wrap cta-inner">
        <div>
          <p className="eyebrow">YOUR NEXT RELEASE STARTS HERE</p>
          <h2>
            Less infrastructure friction.
            <br />
            More room to build.
          </h2>
          <p>
            Tell us what you’re working on. We’ll help define a practical next
            step.
          </p>
        </div>
        <Link className="button" href="/contact">
          Request a Quote <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
export const approach = [
  [
    "Assess",
    "Understand your environment, constraints, and the problem worth solving.",
  ],
  [
    "Plan",
    "Agree on scope, deliverables, access, pricing, and acceptance criteria.",
  ],
  [
    "Implement",
    "Make reviewed changes, validate behavior, and document decisions.",
  ],
  [
    "Handover",
    "Walk through the implementation and leave your team with clear operating steps.",
  ],
];
export function Approach() {
  return (
    <div className="grid four steps">
      {approach.map(([title, body], i) => (
        <article key={title}>
          <span className="step-number">0{i + 1}</span>
          <h3>
            {title} {i < 3 && <ArrowRight size={18} />}
          </h3>
          <p>{body}</p>
        </article>
      ))}
    </div>
  );
}
export function FAQ({
  items,
}: {
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="faq">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span aria-hidden="true">+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
export const faqs = [
  [
    "Who is Infravel for?",
    "SaaS startups, software agencies, and growing engineering teams that need direct help with deployment and infrastructure.",
  ],
  [
    "How is a project priced?",
    "Starting rates are a guide. We agree on a written scope and final price after reviewing your environment. Cloud provider and third-party costs are separate unless explicitly quoted.",
  ],
  [
    "Can you work with our existing infrastructure?",
    "Yes. The assessment starts with your current setup. We recommend changes that suit your team, rather than requiring a platform migration.",
  ],
  [
    "Do you offer ongoing or emergency support?",
    "Managed support has an agreed monthly allocation and communication window. Emergency response, 24/7 coverage, and guaranteed resolution times are not included.",
  ],
  [
    "What access will you need?",
    "We agree on least-privilege access during planning. Do not send credentials in the quote form. Sensitive access is arranged through an approved secure channel.",
  ],
] as const;
export function FlowDiagram({
  labels,
  title = "Reference architecture",
}: {
  labels: string[];
  title?: string;
}) {
  return (
    <figure className="flow-diagram">
      <figcaption>{title}</figcaption>
      <div>
        {labels.map((label, i) => (
          <div className="flow-step" key={label}>
            <span className="flow-node">{label}</span>
            {i < labels.length - 1 && (
              <ArrowRight size={20} aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </figure>
  );
}
export function Infrastructure() {
  return (
    <figure
      className="infrastructure"
      aria-label="Reference delivery architecture: commit, validate, deploy to Linux, Docker and Kubernetes, with monitoring"
    >
      <div className="diagram-heading">
        <span>
          <i /> DELIVERY ARCHITECTURE
        </span>
        <span>REFERENCE / 01</span>
      </div>
      <div className="pipeline">
        {[
          [GitBranch, "01", "Commit"],
          [Terminal, "02", "Validate"],
          [Cloud, "03", "Deploy"],
        ].map(([Icon, n, label]) => {
          const I = Icon as typeof Cloud;
          return (
            <div key={String(n)} className="pipeline-node">
              <I size={22} />
              <small>{String(n)}</small>
              <strong>{String(label)}</strong>
            </div>
          );
        })}
      </div>
      <div className="diagram-connector" />
      <div className="runtimes">
        {[
          [Terminal, "Linux"],
          [Container, "Docker"],
          [Network, "Kubernetes"],
        ].map(([Icon, label]) => {
          const I = Icon as typeof Cloud;
          return (
            <div key={String(label)}>
              <I size={24} />
              <span>{String(label)}</span>
            </div>
          );
        })}
      </div>
      <div className="monitor-line">
        <Activity size={20} />
        <span>Metrics → dashboards → actionable alerts</span>
      </div>
      <figcaption>Repeatable releases. Observable infrastructure.</figcaption>
    </figure>
  );
}
