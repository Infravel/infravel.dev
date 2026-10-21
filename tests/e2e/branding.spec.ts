import { test, expect } from "@playwright/test";

test("approved branding, icons, and social metadata resolve", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const headerLogo = page.locator(".header .brand img");
  await expect(headerLogo).toHaveAttribute("alt", "Infravel");
  await expect(page.locator(".hero-brand-image")).toHaveAttribute(
    "src",
    "/brand/infravel-lockup.webp",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/opengraph-image\.jpg/,
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /\/opengraph-image\.jpg/,
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "sizes",
    "180x180",
  );
  await expect(
    page.locator('link[rel="icon"][type="image/png"]'),
  ).toHaveAttribute("sizes", "64x64");
  const organization = await page
    .locator('script[type="application/ld+json"]')
    .first()
    .textContent();
  expect(JSON.parse(organization!).logo).toMatch(
    /\/brand\/infravel-symbol-512\.png$/,
  );
  for (const [path, type] of [
    ["/favicon.ico", /image\/(x-icon|vnd.microsoft.icon)/],
    ["/icon.png", /image\/png/],
    ["/apple-icon.png", /image\/png/],
    ["/opengraph-image.jpg", /image\/jpeg/],
    ["/brand/infravel-lockup.webp", /image\/webp/],
    ["/brand/infravel-symbol-512.png", /image\/png/],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toMatch(type);
  }
  const dimensions = await page.evaluate(async () => {
    const entries = [
      ["/brand/infravel-lockup.webp", 1000, 550],
      ["/icon.png", 64, 64],
      ["/apple-icon.png", 180, 180],
      ["/opengraph-image.jpg", 1200, 630],
    ] as const;
    return Promise.all(
      entries.map(async ([src, width, height]) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return image.naturalWidth === width && image.naturalHeight === height;
      }),
    );
  });
  expect(dimensions.every(Boolean)).toBe(true);
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const ratio = await headerLogo.evaluate((image) => {
      const rect = image.getBoundingClientRect();
      return rect.width / rect.height;
    });
    expect(ratio).toBeCloseTo(1000 / 550, 2);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("mobile menu retains the approved logo and keyboard access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await expect(page.locator(".header .brand img")).toBeVisible();
  const menuPosition = await page
    .locator("#main-nav")
    .evaluate((element) => element.getBoundingClientRect().top);
  const headerBottom = await page
    .locator("header")
    .evaluate((element) => element.getBoundingClientRect().bottom);
  expect(menuPosition).toBeGreaterThanOrEqual(headerBottom - 1);
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
});
