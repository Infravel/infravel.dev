import { z } from "zod";
import { services } from "@/config/services";
import { attributionKeys, cleanAttribution } from "./attribution";

export type NotificationKind = "quote" | "waitlist";
export type NotificationRecord = {
  id: string;
  name: string;
  email: string;
  company: string;
  attribution: string;
  created_at: number;
} & (
  | {
      kind: "quote";
      service: string;
      requirements: string;
      budget: string;
      timeline: string;
    }
  | { kind: "waitlist"; interest: string; consent: number }
);

export function headerText(value: string) {
  // eslint-disable-next-line no-control-regex -- Strip control characters from email header values.
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, " ").trim();
}

export function emailAddress(value: string) {
  // Fail closed: never repair an injected mailbox into a different address.
  if (value !== headerText(value))
    throw new Error("Invalid notification mailbox");
  return z.email().max(254).parse(value);
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function notificationTemplate(record: NotificationRecord) {
  const email = emailAddress(record.email);
  const service =
    record.kind === "quote"
      ? services.find((service) => service.slug === record.service)?.name ||
        "General Inquiry / Cloud Consulting"
      : "OpsPilot";
  const title =
    record.kind === "quote"
      ? "New Infravel Quote Request"
      : "New Infravel OpsPilot Waitlist Registration";
  const subject = headerText(
    record.kind === "quote" ? `${title} — ${service}` : title,
  );
  const fields: [string, string][] = [];
  const add = (label: string, value: string) => {
    if (value) fields.push([label, value]);
  };
  add("Customer full name", record.name);
  add("Customer email", email);
  add("Company", record.company);
  if (record.kind === "quote") {
    add("Requested service", service);
    add("Project description", record.requirements);
    add("Budget", record.budget);
    add("Timeline", record.timeline);
  } else {
    add("Infrastructure interest", record.interest);
    add(
      "Optional marketing updates",
      record.consent === 1 ? "Consented" : "Not opted in",
    );
  }
  add(record.kind === "quote" ? "Lead ID" : "Registration ID", record.id);
  add("Submitted at (UTC)", new Date(record.created_at * 1000).toISOString());
  add(
    "Submission form",
    record.kind === "quote"
      ? "Infravel contact / quote form"
      : "OpsPilot early-access form",
  );
  try {
    const source: unknown = JSON.parse(record.attribution);
    if (source && typeof source === "object") {
      for (const key of attributionKeys) {
        const value = (source as Record<string, unknown>)[key];
        if (typeof value === "string")
          add(`Lead source (${key})`, cleanAttribution(value));
      }
    }
  } catch {
    /* Missing or malformed legacy attribution must not block delivery. */
  }
  const replyLink = `mailto:${encodeURIComponent(email)}`;
  const textContent = [
    title,
    ...fields.map(([label, value]) => `${label}:\n${value}`),
    `Reply to customer: ${replyLink}`,
    "Infravel | Business notification",
  ].join("\n\n");
  const htmlContent = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;background:#f4f7fa;color:#14263d;font-family:Arial,sans-serif;line-height:1.6">
<table role="presentation" style="width:100%;border-collapse:collapse"><tr><td style="padding:24px 12px">
<table role="presentation" style="width:100%;max-width:640px;margin:auto;border-collapse:collapse;background:#ffffff">
<tr><td style="padding:28px;background:#0b1220;color:#f8fafc;font-size:24px;font-weight:bold">infravel<span style="color:#22d3ee">.</span></td></tr>
<tr><td style="padding:28px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 24px">${escapeHtml(title)}</h1>
${fields.map(([label, value]) => `<h2 style="font-size:14px;color:#526277;margin:24px 0 6px">${escapeHtml(label)}</h2><div style="font-size:16px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word">${escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>")}</div>`).join("\n")}
<p style="margin:28px 0"><a href="${escapeHtml(replyLink)}" style="display:inline-block;padding:12px 20px;background:#086b7c;color:#ffffff;text-decoration:none;border-radius:4px">Reply to customer</a></p>
<p style="font-size:14px;color:#526277">Infravel | Business notification</p>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, textContent, htmlContent, replyTo: { email } };
}
