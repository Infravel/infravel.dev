export const attributionKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;
export function cleanAttribution(value: string) {
  return value.replace(/[^a-zA-Z0-9 ._~:/-]/g, "").slice(0, 100);
}
export function parseAttribution(params: URLSearchParams) {
  return Object.fromEntries(
    attributionKeys.flatMap((key) => {
      const value = params.get(key);
      return value ? [[key, cleanAttribution(value)]] : [];
    }),
  );
}
