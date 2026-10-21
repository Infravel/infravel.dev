import { describe, it, expect } from "vitest";
import { services, price, quoteUrl } from "@/config/services";
import { safeBookingUrl } from "@/config/site";
import {
  quoteSchema,
  waitlistSchema,
  parseAttribution,
} from "@/lib/validation";
describe("service configuration", () => {
  it("has all six unique packages and expected starting prices", () => {
    expect(new Set(services.map((s) => s.slug)).size).toBe(6);
    expect(services.map((s) => s.price)).toEqual([
      149, 399, 349, 299, 799, 199,
    ]);
    expect(services.every((s) => s.deliverables.length >= 4)).toBe(true);
  });
  it("formats monthly and project pricing", () => {
    expect(price(services[0])).toBe("$149");
    expect(price(services[5])).toBe("$199/month");
  });
  it("encodes service selections", () => {
    expect(quoteUrl("a&b")).toBe("/contact?service=a%26b");
    expect(quoteUrl()).toBe("/contact");
  });
});
describe("safe input and URL handling", () => {
  it("accepts only https booking URLs without embedded credentials", () => {
    expect(safeBookingUrl("javascript:alert(1)")).toBeNull();
    expect(safeBookingUrl("http://example.com")).toBeNull();
    expect(safeBookingUrl("https://user:pass@example.com")).toBeNull();
    expect(safeBookingUrl("https://example.com/book")).toBe(
      "https://example.com/book",
    );
  });
  it("limits attribution to bounded approved fields", () => {
    const a = parseAttribution(
      new URLSearchParams(
        "utm_source=%3Cscript%3E&email=private@example.com&utm_term=" +
          "x".repeat(130),
      ),
    );
    expect(a).toEqual({ utm_source: "script", utm_term: "x".repeat(100) });
  });
  it("rejects short requirements and unknown service", () => {
    expect(
      quoteSchema.safeParse({
        name: "A",
        email: "bad",
        service: "bad",
        requirements: "short",
        turnstileToken: "x",
      }).success,
    ).toBe(false);
  });
  it("normalizes waitlist email and preserves opt-in as false by default", () => {
    const data = waitlistSchema.parse({
      email: "HELLO@example.com",
      turnstileToken: "x",
    });
    expect(data.email).toBe("hello@example.com");
    expect(data.consent).toBe(false);
  });
});
