"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navigation, site } from "@/config/site";
import { TrackedLink } from "./analytics";
import { BrandLogo } from "./brand-logo";
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", dismiss);
    return () => document.removeEventListener("keydown", dismiss);
  }, [open]);
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link className="brand" href="/" aria-label="Infravel home">
          <BrandLogo eager />
        </Link>
        <button
          ref={menuButton}
          className="menu-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="main-nav"
          className={open ? "nav open" : "nav"}
          aria-label="Main navigation"
        >
          {navigation.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link className="button small header-quote" href="/contact">
          Request a Quote <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div>
          <Link className="brand" href="/" aria-label="Infravel home">
            <BrandLogo />
          </Link>
          <p>{site.tagline}</p>
          <p className="fine">
            Founder-led DevOps & cloud infrastructure engineering.
          </p>
          {site.email && (
            <TrackedLink
              href={`mailto:${site.email}`}
              event="contact_email_click"
            >
              {site.email}
            </TrackedLink>
          )}
        </div>
        <nav aria-label="Footer">
          {navigation.map(([label, href]) => (
            <Link href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div>
          <p className="eyebrow">LET’S BUILD SOMETHING RELIABLE</p>
          <Link className="text-link" href="/contact">
            Tell us about your project <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} Infravel</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <span className="fine">Built for what comes next.</span>
      </div>
    </footer>
  );
}
