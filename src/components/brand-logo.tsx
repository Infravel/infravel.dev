import Image from "next/image";

export function BrandLogo({
  className = "brand-image",
  eager = false,
}: {
  className?: string;
  eager?: boolean;
}) {
  return (
    <span className={`brand-frame ${className}`}>
      <Image
        src="/brand/infravel-lockup.webp"
        alt="Infravel"
        width={1000}
        height={550}
        className="brand-artwork"
        // Preserve the approved 22KB file. The display frame removes only the
        // outer background gutters; no image processing or redrawing is used.
        unoptimized
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : undefined}
      />
    </span>
  );
}
