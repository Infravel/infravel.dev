export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  code?: string;
};
export type Article = {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated: string;
  tags: string[];
  sections: ArticleSection[];
  sources: { title: string; url: string }[];
};
export const articles: Article[] = [
  {
    slug: "building-reliable-cicd-deployment-pipelines",
    title: "Building reliable CI/CD deployment pipelines",
    description:
      "Artifact promotion, deployment health checks, concurrency, and rollback planning for small engineering teams.",
    published: "2026-10-15",
    updated: "2026-10-15",
    tags: ["CI/CD", "Delivery engineering"],
    sections: [
      {
        heading: "Start with a release contract",
        paragraphs: [
          "A successful build is not the same as a successful deployment. Before automating a release, define the artifact being deployed, the environment receiving it, the checks that demonstrate health, and the person authorized to approve the change. Write down what happens if validation fails.",
          "For a small SaaS application, a useful pipeline has a short path: install from a lockfile, run meaningful checks, build an immutable artifact, deploy that artifact, and validate it through the same routing layer customers use. Keep production credentials out of build jobs that do not need them.",
        ],
      },
      {
        heading: "Build once and promote the same artifact",
        paragraphs: [
          "Rebuilding from the same commit in every environment can still produce different outputs when base images, external resources, or dependency resolution change. Build a versioned image once and deploy its digest through staging and production. Record the source commit and artifact digest together.",
          "Keep the previous known-good artifact available. A release log should identify the deployed digest, environment, and validation result without containing secrets. Use short-lived provider credentials where available, and restrict deployment permissions to the smallest required scope.",
        ],
      },
      {
        heading: "Serialize changes to shared environments",
        paragraphs: [
          "Two releases modifying the same environment can invalidate each other’s health checks. Use deployment concurrency controls and explicit environment approvals. Cancellation is useful for redundant test runs, but aborting a deployment halfway through a migration may leave partial state. Decide on cancellation behavior deliberately.",
          "In GitHub Actions, a production deployment job can use an environment and concurrency group. Keep write access to that environment limited. The example below is a job fragment; it is not a complete pipeline.",
        ],
        code: "environment: production\nconcurrency:\n  group: deploy-production\n  cancel-in-progress: false\npermissions:\n  contents: read",
      },
      {
        heading: "Validate readiness and preserve rollback options",
        paragraphs: [
          "A process that has started may still be unable to serve traffic. Use bounded readiness checks, then validate a critical application path through the public entry point. Separate dependency health from liveness so a temporary database issue does not create a restart loop.",
          "Rollback is a system design decision. Reverting an application image may not reverse a destructive database migration. Prefer backward-compatible expand-and-contract database changes, test backup restoration, and include a roll-forward option. Never infer zero downtime from the existence of a blue/green deployment script.",
        ],
      },
      {
        heading: "Leave the team an operating procedure",
        paragraphs: [
          "Document how to release, inspect failure logs, identify the active artifact, and recover from a failed validation. Test that procedure in a disposable environment. A pipeline is dependable when another engineer can operate it without reconstructing its assumptions.",
        ],
      },
    ],
    sources: [
      {
        title: "GitHub Actions: control workflow concurrency",
        url: "https://docs.github.com/en/actions/using-jobs/using-concurrency",
      },
      {
        title: "Docker: image digests",
        url: "https://docs.docker.com/dhi/core-concepts/digests/",
      },
    ],
  },
  {
    slug: "linux-server-monitoring-for-small-saas-teams",
    title: "Linux server monitoring for small SaaS teams",
    description:
      "Choose useful host signals, secure metrics collection, and create alerts with clear ownership and response steps.",
    published: "2026-10-15",
    updated: "2026-10-15",
    tags: ["Linux", "Monitoring"],
    sections: [
      {
        heading: "Monitor the service before the server",
        paragraphs: [
          "CPU charts cannot tell you whether a customer can complete a request. Start with application availability, request errors, and latency. Add host metrics to explain those symptoms. For a small team, a few trusted signals are more useful than a dashboard full of unfamiliar measurements.",
          "Define the owner and expected action for every alert. If nobody can explain what to do when an alert fires, it is probably a dashboard signal or a ticket rather than an urgent page. Avoid implying continuous response coverage unless your team actually staffs it.",
        ],
      },
      {
        heading: "Collect a focused set of host metrics",
        paragraphs: [
          "Node Exporter exposes Linux host metrics that Prometheus can scrape. Begin with CPU saturation, memory availability, filesystem capacity, disk I/O, and network errors. Memory availability is more useful than simply subtracting free memory from total memory, because Linux uses memory for reclaimable caches.",
          "Track both remaining disk capacity and growth. Inspect inode availability as well as bytes: a filesystem full of tiny files can run out of inodes while it still has free space. Label metrics consistently by environment and host. Avoid unbounded labels such as customer email addresses or individual request IDs.",
        ],
      },
      {
        heading: "Keep the monitoring path private",
        paragraphs: [
          "Exporters and Prometheus endpoints can expose operational information. Restrict scraping to a private network or explicitly authorized collectors. Put dashboards behind authentication and use TLS when traffic crosses an untrusted network. Do not publish an exporter port merely to make setup easier.",
          "Set data retention and disk limits deliberately. Monitoring competes for resources with the services it observes, especially when everything runs on one small host. A separate external availability check can reveal failures when the host and its local monitoring both stop.",
        ],
      },
      {
        heading: "Use sustained conditions and useful context",
        paragraphs: [
          "Short spikes are common. Use an alert duration to distinguish sustained pressure from transient noise. The following rule is an example for a host filesystem; adjust the threshold, duration, filesystem filters, and runbook to your environment.",
        ],
        code: '- alert: HostFilesystemLowSpace\n  expr: (node_filesystem_avail_bytes{fstype!~"tmpfs|overlay"} / node_filesystem_size_bytes{fstype!~"tmpfs|overlay"}) < 0.10\n  for: 15m\n  labels:\n    severity: warning\n  annotations:\n    summary: "Filesystem space below 10%"',
      },
      {
        heading: "Test the alert route, not just the query",
        paragraphs: [
          "A valid rule does not prove a notification will arrive. Exercise the delivery path in a test environment, including grouping, routing, silences, and recovery notifications. Document how to inspect logs and identify the process consuming resources.",
          "Review alerts after incidents and during routine maintenance. Remove duplicates, tune noisy thresholds, and keep runbooks short enough to use during an investigation. Monitoring is an operating practice, not a one-time dashboard installation.",
        ],
      },
    ],
    sources: [
      {
        title: "Prometheus: Node Exporter guide",
        url: "https://prometheus.io/docs/guides/node-exporter/",
      },
      {
        title: "Prometheus: alerting rules",
        url: "https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/",
      },
    ],
  },
  {
    slug: "practical-docker-deployment-patterns",
    title: "Practical Docker deployment patterns",
    description:
      "A small-team deployment approach covering immutable images, container configuration, persistence, health checks, and recovery.",
    published: "2026-10-15",
    updated: "2026-10-15",
    tags: ["Docker", "Deployment"],
    sections: [
      {
        heading: "Keep the runtime image focused",
        paragraphs: [
          "Use a multi-stage Dockerfile to separate compilation from runtime where that suits the application. Install only the runtime dependencies needed by the final image. Run as a non-root user when the workload permits it, and use an explicit working directory.",
          "A small image is easier to distribute and inspect, but size is not a complete security measure. Maintain base images, scan dependencies, and verify that the application still has the certificates, libraries, and permissions it needs. Pin release artifacts by digest for reproducible promotion.",
        ],
      },
      {
        heading: "Separate image, configuration, and state",
        paragraphs: [
          "An image should contain application code and runtime dependencies. Supply environment-specific configuration at deployment time. Keep secrets out of Dockerfiles, source repositories, build arguments, and committed Compose files. Use an appropriate secrets mechanism for the deployment environment.",
          "Container filesystems are disposable. Put persistent data in a deliberately managed volume or external service. A volume survives container recreation, but it does not provide a backup. Define what data matters, how it is backed up, and how restoration is tested.",
        ],
      },
      {
        heading: "Compose can be enough for a single host",
        paragraphs: [
          "For a small application on one server, Docker Compose can make dependencies and configuration explicit without introducing a cluster. Keep database ports private, route public traffic through a reverse proxy, and use separate configuration for development and production.",
          "The following fragment illustrates an internal database and a loopback-bound application port. The health endpoint and application image are placeholders to adapt and test. This is not a complete production configuration.",
        ],
        code: 'services:\n  app:\n    image: ${APP_IMAGE:?set a versioned image digest}\n    ports:\n      - "127.0.0.1:3000:3000"\n    restart: unless-stopped\n  db:\n    image: ${POSTGRES_IMAGE:?set an approved digest}\n    volumes:\n      - db-data:/var/lib/postgresql\n    environment:\n      POSTGRES_PASSWORD_FILE: /run/secrets/db_password\n    secrets:\n      - db_password\nvolumes:\n  db-data:\nsecrets:\n  db_password:\n    file: ./secrets/db_password',
      },
      {
        heading: "Readiness and restart are different mechanisms",
        paragraphs: [
          "A health check reports health status. In a plain Docker or Compose deployment, an unhealthy status does not by itself guarantee a container restart. A restart policy usually reacts to process exit. Design the application to fail clearly when it cannot operate, and use an appropriate supervisor or deployment controller when remediation is required.",
          "Starting a database container does not prove it is ready for requests. Use dependency health checks where appropriate and make the application retry transient dependency failures with bounded backoff. Test shutdown behavior so the process can stop accepting requests and finish in-flight work within its grace period.",
        ],
      },
      {
        heading: "Treat restoration as part of deployment",
        paragraphs: [
          "Retain a known-good application digest and document the configuration used with it. Check database compatibility before rolling the image back. Test backups in an isolated environment, and avoid sending unrestricted container logs to an indefinitely retained sink.",
          "Move to Kubernetes when workload coordination, team size, or operational requirements justify it. A single-host design still has a single-host failure boundary; acknowledge that boundary and plan recovery rather than describing it as highly available.",
        ],
      },
    ],
    sources: [
      {
        title: "Docker: multi-stage builds",
        url: "https://docs.docker.com/build/building/multi-stage/",
      },
      {
        title: "Docker: production Compose",
        url: "https://docs.docker.com/compose/how-tos/production/",
      },
      {
        title: "Docker: container restart policies",
        url: "https://docs.docker.com/engine/containers/start-containers-automatically/",
      },
    ],
  },
];
export function readingTime(article: Article) {
  return Math.max(
    1,
    Math.ceil(
      article.sections.reduce(
        (n, s) => n + s.paragraphs.join(" ").split(/\s+/).length,
        0,
      ) / 200,
    ),
  );
}
