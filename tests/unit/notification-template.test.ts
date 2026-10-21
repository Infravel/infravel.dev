import { describe, expect, it } from "vitest";
import {
  emailAddress,
  headerText,
  notificationTemplate,
  type NotificationRecord,
} from "@/lib/notification-template";

const quote: NotificationRecord = {
  kind: "quote",
  id: "fictional-lead-001",
  name: "Amira Example",
  email: "amira@example.com",
  company: "Example Systems",
  service: "cicd-pipeline-setup",
  requirements:
    "We need a repeatable CI/CD pipeline for our SaaS application.\nPlease include staging deployment, automated checks, and a documented handover.",
  budget: "$1,000–$2,500",
  timeline: "Within four weeks",
  created_at: 1792569600,
  attribution: JSON.stringify({
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "engineering-october",
  }),
};
const waitlist: NotificationRecord = {
  kind: "waitlist",
  id: "fictional-registration-001",
  name: "Sam Example",
  email: "sam@example.com",
  company: "Example Cloud",
  interest: "Linux and Docker monitoring",
  consent: 0,
  created_at: 1792569600,
  attribution: "{}",
};

describe("business notification templates", () => {
  it("includes every quote field and preserves the whole validated message", () => {
    const message = `${"x".repeat(5992)}\nEND <&>`;
    expect(message.length).toBe(6000);
    const content = notificationTemplate({ ...quote, requirements: message });
    for (const value of [
      quote.name,
      quote.email,
      quote.company,
      quote.budget,
      quote.timeline,
      quote.id,
      "CI/CD Pipeline Setup",
      "newsletter",
      "email",
      "engineering-october",
      "2026-10-21T08:00:00.000Z",
    ]) {
      expect(content.textContent).toContain(value);
      expect(content.htmlContent).toContain(value);
    }
    expect(content.textContent).toContain(message);
    expect(content.htmlContent).toContain(
      `${"x".repeat(5992)}<br>END &lt;&amp;&gt;`,
    );
    expect(content.subject).toBe(
      "New Infravel Quote Request — CI/CD Pipeline Setup",
    );
  });

  it("omits absent optional fields and supports general inquiries", () => {
    const content = notificationTemplate({
      ...quote,
      service: "not-sure",
      company: "",
      timeline: "",
      budget: "",
      attribution: "{}",
    });
    for (const label of ["Company:", "Budget:", "Timeline:", "Lead source ("])
      expect(content.textContent).not.toContain(label);
    expect(content.subject).toContain("General Inquiry / Cloud Consulting");
  });

  it("escapes all HTML fields and prevents mailto parameter/header injection", () => {
    const attack = `"><img src=x onerror='alert(1)'>&`;
    const content = notificationTemplate({
      ...quote,
      id: attack,
      name: attack,
      company: attack,
      requirements: attack,
      timeline: attack,
      budget: attack,
    });
    expect(content.htmlContent).not.toContain("<img");
    expect(content.htmlContent).not.toContain("onerror='alert");
    expect(content.htmlContent).toContain(
      "&quot;&gt;&lt;img src=x onerror=&#39;alert(1)&#39;&gt;&amp;",
    );
    expect(content.textContent).toContain(attack);
    expect(content.htmlContent).toContain('href="mailto:amira%40example.com"');
    expect(content.replyTo).toEqual({ email: quote.email });
    expect(content.subject).not.toContain(attack);
    expect(headerText("Subject\r\nBcc: x\u0000\u2028end")).toBe(
      "Subject  Bcc: x  end",
    );
    for (const email of [
      "a@example.com\r\nBcc: b@example.com",
      "a@example.com,b@example.com",
      "a@example.com?bcc=b@example.com",
      'a" onmouseover="x@example.com',
    ]) {
      expect(() => emailAddress(email)).toThrow();
      expect(() => notificationTemplate({ ...quote, email })).toThrow();
    }
  });

  it("uses only collected waitlist fields and distinguishes consent", () => {
    const content = notificationTemplate(waitlist);
    for (const value of [
      waitlist.name,
      waitlist.email,
      waitlist.company,
      waitlist.interest,
      waitlist.id,
      "Not opted in",
    ])
      expect(content.textContent).toContain(value);
    for (const label of [
      "Requested service",
      "Project description",
      "Budget",
      "Timeline",
      "Lead ID",
    ])
      expect(content.textContent).not.toContain(label);
    expect(
      notificationTemplate({ ...waitlist, consent: 1 }).textContent,
    ).toContain("Consented");
    const minimal = notificationTemplate({
      ...waitlist,
      name: "",
      company: "",
      interest: "",
    });
    expect(minimal.textContent).not.toContain("Customer full name");
  });

  it("allowlists attribution and ignores malformed legacy attribution", () => {
    const content = notificationTemplate({
      ...quote,
      attribution: JSON.stringify({
        utm_source: "web",
        turnstileToken: "private-token",
        password: "private-password",
        api_key: "private-key",
        arbitrary: "private-metadata",
      }),
    });
    expect(content.textContent).toContain("web");
    expect(JSON.stringify(content)).not.toContain("private-");
    expect(() =>
      notificationTemplate({ ...quote, attribution: "not-json" }),
    ).not.toThrow();
    expect(() =>
      notificationTemplate({ ...quote, attribution: "null" }),
    ).not.toThrow();
  });

  it("provides reviewable HTML and plain-text previews with fictional customers", async () => {
    for (const [name, record] of [
      ["quote", quote],
      ["waitlist", waitlist],
    ] as const) {
      const content = notificationTemplate(record);
      await expect(content.htmlContent).toMatchFileSnapshot(
        `../../docs/email-previews/${name}.html`,
      );
      await expect(
        `Subject: ${content.subject}\n\n${content.textContent}\n`,
      ).toMatchFileSnapshot(`../../docs/email-previews/${name}.txt`);
    }
  });
});
