import { z } from "zod";
import { services } from "@/config/services";
import { cleanAttribution } from "./attribution";
const text = (max: number) => z.string().trim().max(max).default("");
export const budgets = [
  "Under $250",
  "$250–$500",
  "$500–$1,000",
  "$1,000–$2,500",
  "$2,500+",
] as const;
export const attributionSchema = z
  .object({
    utm_source: text(100).transform(cleanAttribution),
    utm_medium: text(100).transform(cleanAttribution),
    utm_campaign: text(100).transform(cleanAttribution),
    utm_content: text(100).transform(cleanAttribution),
    utm_term: text(100).transform(cleanAttribution),
  })
  .partial()
  .default({});
export const quoteSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  email: z
    .string()
    .email("Enter a valid email address.")
    .max(254)
    .transform((x) => x.toLowerCase()),
  company: text(150),
  service: z
    .string()
    .refine(
      (x) => services.some((s) => s.slug === x) || x === "not-sure",
      "Choose a service.",
    ),
  requirements: z
    .string()
    .trim()
    .min(30, "Add at least 30 characters about your project.")
    .max(6000),
  timeline: text(150),
  budget: z.union([z.enum(budgets), z.literal("")]).default(""),
  website: text(200),
  turnstileToken: z.string().min(1, "Complete the security check.").max(2048),
  attribution: attributionSchema,
});
export const waitlistSchema = z.object({
  email: z
    .string()
    .email("Enter a valid email address.")
    .max(254)
    .transform((x) => x.toLowerCase()),
  name: text(100),
  company: text(150),
  interest: text(200),
  consent: z.boolean().default(false),
  website: text(200),
  turnstileToken: z.string().min(1, "Complete the security check.").max(2048),
  attribution: attributionSchema,
});
export type QuoteInput = z.input<typeof quoteSchema>;
export type WaitlistInput = z.input<typeof waitlistSchema>;
export { parseAttribution } from "./attribution";
