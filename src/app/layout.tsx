import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource/geist/latin-400.css";
import "@fontsource/geist/latin-500.css";
import "@fontsource/geist/latin-600.css";
import "@fontsource/geist/latin-700.css";
import "./globals.css";
import { Header, Footer } from "@/components/layout";
import { AttributionCapture } from "@/components/analytics";
import { site } from "@/config/site";
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Infravel | DevOps & Cloud Infrastructure Engineering",
    template: "%s | Infravel",
  },
  description: site.tagline,
  openGraph: {
    siteName: site.name,
    type: "website",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Infravel ribbon symbol and wordmark",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image.jpg"] },
  robots: {
    index: process.env.DEPLOYMENT_ENV === "production",
    follow: process.env.DEPLOYMENT_ENV === "production",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AttributionCapture />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: site.url,
              description: site.tagline,
              logo: new URL("/brand/infravel-symbol-512.png", site.url).href,
            }),
          }}
        />
        {token && (
          <Script
            src="https://static.cloudflareinsights.com/beacon.min.js"
            strategy="afterInteractive"
            data-cf-beacon={JSON.stringify({ token })}
          />
        )}
      </body>
    </html>
  );
}
