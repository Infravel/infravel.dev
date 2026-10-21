export type WorkItem = {
  title: string;
  type:
    | "Engineering Demonstration"
    | "Reference Architecture"
    | "Verified Client Case Study";
  stack: string[];
  problem: string;
  flow: string[];
  summary: string;
  repository?: string;
};
export const work: WorkItem[] = [
  {
    title: "Containerized API & database",
    type: "Reference Architecture",
    stack: ["Go", "PostgreSQL", "Docker Compose"],
    problem:
      "Keep application deployment separate from persistent database storage.",
    flow: ["Reverse proxy", "Go API", "PostgreSQL"],
    summary:
      "A conceptual Compose design with a stateless API, private database network, and a persistent volume. Database backup and restore need a separate tested procedure.",
  },
  {
    title: "GitOps workload delivery",
    type: "Reference Architecture",
    stack: ["Kubernetes", "Argo CD", "Git"],
    problem:
      "Keep reviewed deployment configuration and cluster state aligned.",
    flow: ["Reviewed Git", "Argo CD", "Kubernetes"],
    summary:
      "A reference flow where configuration changes are reviewed in Git and reconciled into a cluster. Secrets, access controls, and rollback policies must be designed for the environment.",
  },
  {
    title: "Build once. Promote deliberately.",
    type: "Reference Architecture",
    stack: ["GitHub Actions", "OCI images", "Linux"],
    problem:
      "Reduce manual deployment steps and make release artifacts traceable.",
    flow: ["Tests + build", "Image registry", "Validated deploy"],
    summary:
      "Build a versioned image after tests, promote the same artifact, validate application health, and retain the previous artifact for rollback. Database changes need separate compatibility planning.",
  },
  {
    title: "Linux monitoring signals",
    type: "Reference Architecture",
    stack: ["Node Exporter", "Prometheus", "Grafana"],
    problem:
      "Distinguish infrastructure symptoms from actionable operational signals.",
    flow: ["Node Exporter", "Prometheus", "Dashboards + alerts"],
    summary:
      "Collect host metrics on a private network, visualize trends, and route alerts with ownership and a runbook. Exporters and dashboards should not be openly exposed.",
  },
];
