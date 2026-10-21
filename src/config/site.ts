export const site = {
  name: "Infravel",
  url: "https://infravel.dev",
  tagline: "Infrastructure that moves with you.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  founder: process.env.NEXT_PUBLIC_FOUNDER_NAME || "",
};
export function safeBookingUrl(value: string | undefined) {
  try {
    const u = new URL(value || "");
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export const bookingUrl = safeBookingUrl(process.env.NEXT_PUBLIC_BOOKING_URL);
export const navigation = [
  ["Services", "/services"],
  ["Work", "/work"],
  ["About", "/about"],
  ["OpsPilot", "/opspilot"],
  ["Insights", "/insights"],
  ["Contact", "/contact"],
] as const;
