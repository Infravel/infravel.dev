export type Service = {
  slug: string;
  name: string;
  short: string;
  price: number;
  monthly?: boolean;
  overview: string;
  problem: string;
  deliverables: string[];
  tools: string[];
  diagram: string[];
};
export const services: Service[] = [
  {
    slug: "linux-server-troubleshooting",
    name: "Linux Server Troubleshooting",
    short: "Get to the root of the issue.",
    price: 149,
    overview:
      "Understand what is failing, why it is happening, and what to do next. A focused investigation of an agreed Linux server issue.",
    problem:
      "A failing service, overloaded server, or growing disk usage is keeping your team away from product development.",
    deliverables: [
      "Initial environment assessment",
      "Agreed issue investigation and Linux service diagnostics",
      "CPU, memory, disk, and process investigation",
      "Findings and remediation recommendations",
    ],
    tools: ["Linux", "systemd", "journalctl"],
    diagram: ["Linux host", "Services · processes", "Resources · logs"],
  },
  {
    slug: "cicd-pipeline-setup",
    name: "CI/CD Pipeline Setup",
    short: "From commit to confident release.",
    price: 399,
    overview:
      "Replace manual release steps with a repeatable build and deployment workflow that your team can understand and operate.",
    problem:
      "Releases rely on manual commands, inconsistent environments, and knowledge held by a single engineer.",
    deliverables: [
      "Jenkins, GitHub Actions, or GitLab CI pipeline",
      "Automated build workflow",
      "Deployment automation",
      "Basic deployment validation",
      "Documentation and handover",
    ],
    tools: ["GitHub Actions", "GitLab CI", "Jenkins"],
    diagram: ["Commit", "Build + test", "Deploy + validate"],
  },
  {
    slug: "docker-deployment",
    name: "Docker Deployment",
    short: "Consistent environments. Simpler delivery.",
    price: 349,
    overview:
      "Package and deploy your application with a practical container setup suited to its runtime and operational needs.",
    problem:
      "Your application works locally but behaves differently on the server, and container configuration has become difficult to maintain.",
    deliverables: [
      "Dockerfile creation or optimization",
      "Container configuration",
      "Docker Compose where appropriate",
      "Deployment verification",
      "Documentation",
    ],
    tools: ["Docker", "Compose", "Linux"],
    diagram: ["Image build", "Container runtime", "Volumes · network"],
  },
  {
    slug: "monitoring-alerting",
    name: "Monitoring & Alerting Setup",
    short: "See the signal. Know what needs attention.",
    price: 299,
    overview:
      "Give your team a useful view of infrastructure health, with actionable metrics, dashboards, and alert rules.",
    problem:
      "You learn about failures from customers, while noisy alerts and missing metrics make investigation harder.",
    deliverables: [
      "Prometheus/Grafana setup where suitable",
      "Infrastructure metrics",
      "Operational dashboards",
      "Alert rules",
      "Operational documentation",
    ],
    tools: ["Prometheus", "Grafana", "Alertmanager"],
    diagram: ["Exporters", "Prometheus", "Grafana + alerts"],
  },
  {
    slug: "kubernetes-deployment",
    name: "Kubernetes Deployment",
    short: "Workloads built for the way you operate.",
    price: 799,
    overview:
      "Deploy your application onto an agreed Kubernetes environment with explicit configuration, health checks, and documented operating steps.",
    problem:
      "Workload configuration, service discovery, and missing health probes are making Kubernetes deployments difficult to reason about.",
    deliverables: [
      "Kubernetes workload configuration",
      "Deployment manifests",
      "Services and configuration",
      "Health probes",
      "Deployment validation",
      "Handover documentation",
    ],
    tools: ["Kubernetes", "Helm", "kubectl"],
    diagram: ["Ingress · service", "Deployment", "Pods + probes"],
  },
  {
    slug: "managed-devops-support",
    name: "Managed DevOps Support",
    short: "Keep infrastructure moving forward.",
    price: 199,
    monthly: true,
    overview:
      "An agreed monthly allocation of practical engineering support for teams that need help maintaining and improving their infrastructure.",
    problem:
      "Maintenance and deployment requests keep accumulating without a dedicated infrastructure owner.",
    deliverables: [
      "Agreed monthly support allocation",
      "Routine infrastructure checks",
      "Deployment assistance",
      "Maintenance activities",
      "Monitoring review",
      "Support reporting",
    ],
    tools: ["Terraform", "Ansible", "Cloud"],
    diagram: ["Infrastructure", "Checks + changes", "Review + handover"],
  },
];
export const price = (s: Pick<Service, "price" | "monthly">) =>
  `$${s.price.toLocaleString("en-US")}${s.monthly ? "/month" : ""}`;
export const pricingNote =
  "Prices are introductory starting rates. Final pricing depends on project scope, infrastructure complexity, and requirements.";
export const quoteUrl = (slug?: string) =>
  slug ? `/contact?service=${encodeURIComponent(slug)}` : "/contact";
