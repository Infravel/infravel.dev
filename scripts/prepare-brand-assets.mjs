import { copyFile, mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";

// Deterministic format/size preparation only. Never redraw, crop, or recolor artwork.
const source = resolve(
  process.argv[2] || "infravel-logo-assets/infravel-logo-assets",
);
const brand = resolve("public/brand");
const app = resolve("src/app");
await mkdir(brand, { recursive: true });
for (const name of [
  "infravel-lockup.webp",
  "infravel-full.webp",
  "infravel-symbol-192.png",
  "infravel-symbol-512.png",
]) {
  await copyFile(join(source, name), join(brand, name));
}
await copyFile(join(source, "infravel-favicon-64.png"), join(app, "icon.png"));
await sharp(join(source, "infravel-symbol-512.png"))
  .resize(180, 180, { fit: "contain" })
  .png()
  .toFile(join(app, "apple-icon.png"));
// Full approved 1200x600 image, padded rather than stretched to the social ratio.
await sharp(join(source, "infravel-full.webp"))
  .extend({ top: 15, bottom: 15, left: 0, right: 0, background: "#0b1220" })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(join(app, "opengraph-image.jpg"));

// ICO directory with PNG frames derived from the owner's prepared favicon.
const sizes = [16, 32, 64];
const frames = await Promise.all(
  sizes.map((size) =>
    sharp(join(source, "infravel-favicon-64.png"))
      .resize(size, size)
      .png()
      .toBuffer(),
  ),
);
const header = Buffer.alloc(6 + 16 * frames.length);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(frames.length, 4);
let offset = header.length;
for (const [index, frame] of frames.entries()) {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(frame.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
}
const { writeFile } = await import("node:fs/promises");
await writeFile(join(app, "favicon.ico"), Buffer.concat([header, ...frames]));
