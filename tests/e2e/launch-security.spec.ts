import { test, expect } from "@playwright/test";

test("www canonical redirect preserves path and query without following a live domain", async ({
  request,
}) => {
  const response = await request.get("/services?utm_source=review", {
    headers: { host: "www.infravel.dev" },
    maxRedirects: 0,
  });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe(
    "https://infravel.dev/services?utm_source=review",
  );
});

test("Worker preview hosts retain security headers and noindex", async ({
  request,
}) => {
  const response = await request.get("/", {
    headers: { host: "infravel-production.example.workers.dev" },
  });
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBe(
    "strict-origin-when-cross-origin",
  );
});
