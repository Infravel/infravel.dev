import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">404 / PAGE NOT FOUND</p>
        <h1>This route doesn’t lead anywhere.</h1>
        <p>Explore our services or return to the homepage.</p>
        <Link className="button" href="/">
          Back to Infravel ↗
        </Link>
      </div>
    </section>
  );
}
