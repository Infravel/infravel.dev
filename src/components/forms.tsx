"use client";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { services } from "@/config/services";
import {
  budgets,
  quoteSchema,
  waitlistSchema,
  parseAttribution,
} from "@/lib/validation";
import { track } from "./analytics";
type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}
type FormValues = {
  name: string;
  email: string;
  company: string;
  service: string;
  requirements: string;
  timeline: string;
  budget: string;
  interest: string;
  consent: boolean;
  website: string;
  turnstileToken: string;
  attribution: Record<string, string>;
};
export function InquiryForm({
  kind,
  preselected = "",
}: {
  kind: "quote" | "waitlist";
  preselected?: string;
}) {
  const isQuote = kind === "quote";
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const started = useRef(false);
  useEffect(() => {
    if (success) confirmation.current?.focus();
  }, [success]);
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      email: "",
      company: "",
      service: services.some((s) => s.slug === preselected) ? preselected : "",
      requirements: "",
      timeline: "",
      budget: "",
      interest: "",
      consent: false,
      website: "",
      turnstileToken: "",
      attribution: {},
    },
  });
  useEffect(() => {
    const current = parseAttribution(
      new URLSearchParams(window.location.search),
    );
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("infravel-attribution") || "{}",
      );
      const safeSaved = parseAttribution(new URLSearchParams(saved));
      const value = Object.keys(current).length ? current : safeSaved;
      setValue("attribution", value);
      sessionStorage.setItem("infravel-attribution", JSON.stringify(value));
    } catch {
      setValue("attribution", current);
    }
  }, [setValue]);
  useEffect(() => {
    if (!ready || !key || !widget.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(widget.current, {
      sitekey: key,
      action: kind,
      theme: "light",
      size: "flexible",
      callback: (token: string) => {
        setValue("turnstileToken", token);
        clearErrors("turnstileToken");
      },
      "expired-callback": () => setValue("turnstileToken", ""),
      "error-callback": () => {
        setValue("turnstileToken", "");
        setError("turnstileToken", {
          message: "Security check failed. Please reload or try again.",
        });
      },
    });
    return () => {
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, [ready, key, kind, setValue, setError, clearErrors]);
  function begin() {
    if (!started.current) {
      started.current = true;
      if (isQuote) track("quote_start");
    }
  }
  async function submit(values: FormValues) {
    clearErrors();
    setMessage("");
    const parsed = (isQuote ? quoteSchema : waitlistSchema).safeParse(values);
    if (!parsed.success) {
      for (const [index, issue] of parsed.error.issues.entries()) {
        const field = issue.path[0] as keyof FormValues;
        setError(
          field,
          { message: issue.message },
          { shouldFocus: index === 0 },
        );
      }
      return;
    }
    setSending(true);
    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (data.errors)
          for (const [field, issues] of Object.entries(data.errors))
            setError(field as keyof FormValues, {
              message: (issues as string[])[0],
            });
        throw Error(data.message || "Please try again later.");
      }
      setSuccess(true);
      setMessage(data.message);
      track(isQuote ? "quote_submit_success" : "opspilot_waitlist_success");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit. Please try again.",
      );
      setValue("turnstileToken", "");
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    } finally {
      setSending(false);
    }
  }
  function field(
    name: Exclude<keyof FormValues, "attribution">,
    label: string,
    type = "text",
    required = false,
  ) {
    return (
      <label className="form-field" key={name} htmlFor={name}>
        {label}
        {required ? " *" : " (optional)"}
        <input
          id={name}
          type={type}
          required={required}
          autoComplete={
            name === "name"
              ? "name"
              : name === "email"
                ? "email"
                : name === "company"
                  ? "organization"
                  : "off"
          }
          maxLength={name === "email" ? 254 : name === "company" ? 150 : 100}
          {...register(name)}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        />
        {errors[name] && (
          <span id={`${name}-error`} className="field-error">
            {errors[name]?.message}
          </span>
        )}
      </label>
    );
  }
  if (success)
    return (
      <div
        ref={confirmation}
        className="form-panel"
        role="status"
        tabIndex={-1}
      >
        <span className="pill">REQUEST RECEIVED</span>
        <h2>
          {isQuote
            ? "A useful conversation starts here."
            : "You’re on the list."}
        </h2>
        <p>{message}</p>
        <Link className="text-link" href="/services">
          Explore Infravel services ↗
        </Link>
      </div>
    );
  return (
    <div className="form-panel">
      <h2>
        {isQuote ? "Tell us about your project." : "Get early-access updates."}
      </h2>
      <p className="fine">
        {isQuote
          ? "A little context helps us understand what you need. Required fields are marked *."
          : "We’ll use your email for OpsPilot early-access information. Required fields are marked *."}
      </p>
      <form
        noValidate
        onFocus={begin}
        onSubmit={(event) => {
          void handleSubmit(submit)(event);
        }}
      >
        <div className="form-grid">
          {field("name", "Full name", "text", isQuote)}
          {field("email", "Business email", "email", true)}
        </div>
        {field("company", "Company")}
        {isQuote ? (
          <>
            <label className="form-field" htmlFor="service">
              Service of interest *
              <select
                id="service"
                required
                {...register("service")}
                aria-invalid={!!errors.service}
                aria-describedby={errors.service ? "service-error" : undefined}
              >
                <option value="">Choose a service</option>
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
                <option value="not-sure">
                  Not sure yet / cloud consulting
                </option>
              </select>
              {errors.service && (
                <span className="field-error" id="service-error">
                  {errors.service.message}
                </span>
              )}
            </label>
            <label className="form-field" htmlFor="requirements">
              Project description *
              <textarea
                id="requirements"
                required
                rows={5}
                maxLength={6000}
                placeholder="What are you trying to improve? Tell us about your environment and the result you need."
                {...register("requirements")}
                aria-invalid={!!errors.requirements}
                aria-describedby={
                  errors.requirements
                    ? "requirements-help requirements-error"
                    : "requirements-help"
                }
              />
              <span id="requirements-help" className="fine">
                At least 30 characters. Please do not include passwords, keys,
                or sensitive customer data.
              </span>
              {errors.requirements && (
                <span className="field-error" id="requirements-error">
                  {errors.requirements.message}
                </span>
              )}
            </label>
            <div className="form-grid">
              {field("timeline", "Project timeline")}
              <label className="form-field" htmlFor="budget">
                Budget range (optional)
                <select id="budget" {...register("budget")}>
                  <option value="">Select a range</option>
                  {budgets.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </label>
            </div>
          </>
        ) : (
          <>
            {field("interest", "Infrastructure interest")}
            <label className="consent">
              <input type="checkbox" {...register("consent")} />
              <span>
                Also send me occasional Infravel engineering and service
                updates. Optional; you can withdraw consent by contacting
                Infravel.
              </span>
            </label>
          </>
        )}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>
        <div ref={widget} className="turnstile" />
        {key ? (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setReady(true)}
          />
        ) : (
          <p className="notice">
            Submissions are awaiting security configuration. Please return once
            the service is available.
          </p>
        )}
        {errors.turnstileToken && (
          <p className="field-error" role="alert">
            {errors.turnstileToken.message}
          </p>
        )}
        <p className="fine">
          By submitting, you ask Infravel to respond about{" "}
          {isQuote ? "your project" : "OpsPilot early access"}. Read our{" "}
          <Link className="text-link" href="/privacy">
            Privacy Notice
          </Link>
          .
        </p>
        <button className="button" type="submit" disabled={sending || !key}>
          {sending
            ? "Saving your request…"
            : isQuote
              ? "Request a Quote ↗"
              : "Join the early-access list ↗"}
        </button>
        {message && (
          <div className="form-status error" role="alert">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
