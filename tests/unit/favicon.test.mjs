import { it, expect } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import sharp from "sharp";

it("provides RGBA ICO frames with the exact approved logo pixels", async () => {
  const ico = fs.readFileSync("src/app/favicon.ico");
  expect(ico.readUInt16LE(0)).toBe(0);
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(3);
  // Raw RGBA hashes of the original approved frames, with opaque alpha added.
  const frames = [
    [16, "71d42e8735192b4c3dc60a7728f7b2758bbcc6837451ac91e28ec5faf21690e1"],
    [32, "8a4b176ff65fecf2613492e254fc3894a5ca0cd578d24cd8ed28c1e8dc879412"],
    [64, "48786d03fb57fbdb74b55bbead39918a596ba508bfcc35fe614c31b7e60d94a1"],
  ];
  let end = 6 + frames.length * 16;
  for (const [index, [size, hash]] of frames.entries()) {
    const entry = 6 + index * 16;
    expect(ico[entry]).toBe(size);
    expect(ico[entry + 1]).toBe(size);
    expect(ico.readUInt16LE(entry + 4)).toBe(1);
    expect(ico.readUInt16LE(entry + 6)).toBe(32);
    const length = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    expect(offset).toBe(end);
    const png = ico.subarray(offset, offset + length);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(png[24]).toBe(8);
    expect(png[25]).toBe(6); // PNG truecolor + alpha, required by the ICO decoder.
    const decoded = await sharp(png)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(decoded.info).toMatchObject({
      width: size,
      height: size,
      channels: 4,
    });
    expect(createHash("sha256").update(decoded.data).digest("hex")).toBe(hash);
    end = offset + length;
  }
  expect(end).toBe(ico.length);
});

it("decodes standalone PNG branding assets at their declared dimensions", async () => {
  for (const [file, size] of [
    ["src/app/icon.png", 64],
    ["src/app/apple-icon.png", 180],
    ["public/brand/infravel-symbol-192.png", 192],
    ["public/brand/infravel-symbol-512.png", 512],
  ]) {
    const decoded = await sharp(file)
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect(decoded.info.width).toBe(size);
    expect(decoded.info.height).toBe(size);
    expect([3, 4]).toContain(decoded.info.channels);
  }
});
