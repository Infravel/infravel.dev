import { PageHero } from "@/components/marketing";
import { metadata as meta } from "@/lib/seo";
export const metadata = meta(
  "Website & engagement terms",
  "Draft terms for Infravel website use, project proposals, starting prices, and OpsPilot early-access interest.",
  "/terms",
);
export default function Terms() {
  return (
    <>
      <PageHero
        eyebrow="TERMS / DRAFT FOR BUSINESS REVIEW"
        title="Clear expectations from the start."
        description="Updated 15 October 2026. These draft website terms require business and legal review before launch. A signed project agreement governs paid engagements."
      />
      <section className="section">
        <div className="wrap narrow content-body">
          <h2>Website information</h2>
          <p>
            Infravel publishes information about DevOps consulting,
            infrastructure engineering, and the planned OpsPilot product.
            Technical articles and reference architectures are general
            educational material. Validate changes against your own environment
            before applying them.
          </p>
          <h2>Proposals and pricing</h2>
          <p>
            Published prices are introductory starting rates in USD. Final fees,
            deliverables, dependencies, timing, access arrangements, acceptance
            criteria, payment terms, and ownership are agreed in writing before
            paid work starts. Cloud provider costs and third-party licenses are
            separate unless explicitly quoted.
          </p>
          <h2>Support scope</h2>
          <p>
            Managed support has an agreed monthly allocation and communication
            window. Published services do not include unlimited work, 24/7
            coverage, guaranteed uptime, or guaranteed incident resolution
            times. Any service commitment must be stated in the engagement
            agreement.
          </p>
          <h2>Your responsibilities</h2>
          <p>
            Only request work on systems you are authorized to manage. Provide
            accurate context, arrange appropriate backups, and approve
            production changes under the agreed change process. Do not submit
            credentials in public forms or use the website for abuse.
          </p>
          <h2>OpsPilot</h2>
          <p>
            OpsPilot capabilities are planned and may change. Joining the list
            does not purchase a service, guarantee access, or establish a launch
            date. Any future application will have separate terms.
          </p>
          <h2>Intellectual property and liability</h2>
          <p>
            Project ownership, licensing, confidentiality, warranties, and
            liability limits will be set in the written engagement agreement.
            The business owner must approve jurisdiction, contracting identity,
            and applicable legal language before public launch. Nothing here
            excludes rights that cannot lawfully be excluded.
          </p>
        </div>
      </section>
    </>
  );
}
