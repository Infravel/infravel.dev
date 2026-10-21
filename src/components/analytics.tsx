"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { parseAttribution } from "@/lib/attribution";
export function AttributionCapture() {
  const pathname = usePathname();
  useEffect(() => {
    const value = parseAttribution(new URLSearchParams(window.location.search));
    if (Object.keys(value).length)
      try {
        sessionStorage.setItem("infravel-attribution", JSON.stringify(value));
      } catch {
        /* Storage may be disabled. */
      }
  }, [pathname]);
  return null;
}
export const eventNames = [
  "service_view",
  "quote_start",
  "quote_submit_success",
  "booking_click",
  "contact_email_click",
  "opspilot_waitlist_success",
] as const;
export type EventName = (typeof eventNames)[number];
export function track(event: EventName, service?: string) {
  if (navigator.doNotTrack === "1") return;
  const body = JSON.stringify({ event, ...(service ? { service } : {}) });
  navigator.sendBeacon?.(
    "/api/events",
    new Blob([body], { type: "application/json" }),
  );
}
export function PageEvent({
  event,
  service,
}: {
  event: EventName;
  service?: string;
}) {
  useEffect(() => {
    track(event, service);
  }, [event, service]);
  return null;
}
export function TrackedLink({
  href,
  event,
  children,
  className,
}: {
  href: string;
  event: EventName;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={() => track(event)}
      {...(href.startsWith("https:")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  );
}
