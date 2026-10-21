import Image from "next/image";

export function BrandLogo({
  className = "brand-image",
  eager = false,
}: {
  className?: string;
  eager?: boolean;
}) {
  return (
    <Image
      src="/brand/infravel-lockup.webp"
      alt="Infravel"
      width={1000}
      height={550}
      className={className}
      // The approved WebP is already 22KB; serve it directly without a runtime
      // image transformation service or any change to the approved artwork.
      unoptimized
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
    />
  );
}
