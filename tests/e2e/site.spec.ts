import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { services } from "../../src/config/services";
async function mockSecurity(page: Page) {
  await page.route("**/challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `window.turnstile={render:function(el,options){setTimeout(function(){options.callback('browser-test-token')},20);return 'test';},reset:function(){},remove:function(){}};`,
    }),
  );
}
test("homepage, accessibility, and viewport layout", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Ship with confidence.",
  );
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: isMobile ? 390 : 1440, height: 900 });
  await page.screenshot({
    path: `test-results/homepage-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("navigation and mobile menu", async ({ page, isMobile }) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(
      page.getByRole("button", { name: "Close menu" }),
    ).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Services", exact: true })
    .click();
  await expect(page).toHaveURL(/\/services$/);
  if (isMobile)
    await expect(
      page.getByRole("button", { name: "Open menu" }),
    ).toHaveAttribute("aria-expanded", "false");
});
test("all service detail pages and quote preselection", async ({ page }) => {
  for (const service of services) {
    await page.goto(`/services/${service.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      service.name,
    );
    expect(
      await page
        .locator('main a[href*="/contact?service="]')
        .first()
        .getAttribute("href"),
    ).toContain(service.slug);
  }
  await page.locator('main a[href*="/contact?service="]').first().click();
  await expect(page.getByLabel("Service of interest")).toHaveValue(
    "managed-devops-support",
  );
});
test("quote client validation and confirmed success with mocked API", async ({
  page,
}) => {
  const conversions: Record<string, unknown>[] = [];
  await page.route("**/api/events", async (route) => {
    conversions.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await mockSecurity(page);
  await page.route("**/api/quote", async (route) => {
    const body = route.request().postDataJSON();
    expect(body.email).toBe("engineer@example.com");
    await route.fulfill({
      json: { ok: true, message: "Your request has been saved." },
    });
  });
  await page.goto("/contact?service=docker-deployment");
  await page.getByRole("button", { name: "Request a Quote" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  expect(
    conversions.some((event) => event.event === "quote_submit_success"),
  ).toBe(false);
  await page.getByLabel("Full name").fill("Test Engineer");
  await page.getByLabel("Business email").fill("engineer@example.com");
  await page
    .getByLabel("Project description")
    .fill("We need a reliable Docker deployment for our application.");
  await page.getByRole("button", { name: "Request a Quote" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your request has been saved.",
  );
  await expect
    .poll(() =>
      conversions.some((event) => event.event === "quote_submit_success"),
    )
    .toBe(true);
  expect(
    conversions.every((event) =>
      Object.keys(event).every((key) => ["event", "service"].includes(key)),
    ),
  ).toBe(true);
});
test("waitlist submission with mocked API", async ({ page }) => {
  await mockSecurity(page);
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({
      json: {
        ok: true,
        message: "Your early-access interest has been recorded.",
      },
    }),
  );
  await page.goto("/opspilot");
  await page.getByLabel("Business email").fill("engineer@example.com");
  await page
    .getByRole("button", { name: "Join the early-access list" })
    .click();
  await expect(page.getByRole("status")).toContainText("You’re on the list.");
});
test("forms have accessible labels and no critical violations", async ({
  page,
}) => {
  await mockSecurity(page);
  for (const route of ["/contact", "/opspilot"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
});
test("required pages and internal links resolve", async ({ page, request }) => {
  const pages = [
    "/",
    "/services",
    "/about",
    "/work",
    "/opspilot",
    "/contact",
    "/insights",
    "/privacy",
    "/terms",
  ];
  const links = new Set<string>();
  for (const route of pages) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("href")!)))
      links.add(href.split("?")[0]);
  }
  for (const href of links) {
    expect((await request.get(href)).status(), href).toBe(200);
  }
  expect((await request.get("/nonexistent")).status()).toBe(404);
});

test("marketing routes remain readable and accessible at target widths", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await mockSecurity(page);
  const routes = [
    "/",
    "/services",
    ...services.map((s) => `/services/${s.slug}`),
    "/about",
    "/work",
    "/opspilot",
    "/contact",
    "/insights",
    "/privacy",
    "/terms",
  ];
  await page.goto("/insights");
  routes.push(
    ...(await page
      .locator('main a[href^="/insights/"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute("href")!))),
  );
  for (const route of [...new Set(routes)]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${route} overflow at ${width}px`,
      ).toBe(true);
    }
    for (const width of [360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(result.violations, `${route} at ${width}px`).toEqual([]);
    }
  }
});
