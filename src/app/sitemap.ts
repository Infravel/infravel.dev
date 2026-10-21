import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { services } from "@/config/services";
import { articles } from "@/content/insights";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/services",
    "/about",
    "/work",
    "/opspilot",
    "/contact",
    "/insights",
    "/privacy",
    "/terms",
    ...services.map((s) => `/services/${s.slug}`),
    ...articles.map((a) => `/insights/${a.slug}`),
  ].map((path) => ({
    url: site.url + path,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
