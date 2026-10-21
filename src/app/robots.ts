import type { MetadataRoute } from "next";
import { site } from "@/config/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules:
      process.env.DEPLOYMENT_ENV === "production"
        ? { userAgent: "*", allow: "/", disallow: "/api/" }
        : { userAgent: "*", disallow: "/" },
    sitemap: site.url + "/sitemap.xml",
  };
}
