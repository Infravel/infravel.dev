import { ImageResponse } from "next/og";
export const alt = "Infravel — Infrastructure that moves with you.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#0b1220",
        color: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 38 }}>
        infravel<span style={{ color: "#22d3ee" }}>.</span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        <span>Ship with confidence.</span>
        <span style={{ color: "#22d3ee" }}>Run with reliability.</span>
      </div>
      <div style={{ display: "flex", fontSize: 22, color: "#aebcd0" }}>
        DEVOPS & CLOUD INFRASTRUCTURE ENGINEERING
      </div>
    </div>,
    size,
  );
}
