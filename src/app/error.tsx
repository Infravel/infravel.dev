"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="section">
      <div className="wrap">
        <h1>Something interrupted this page.</h1>
        <p>
          Please try again. If you submitted a form, check for its confirmation
          before sending another request.
        </p>
        <button className="button" onClick={reset}>
          Try again
        </button>
      </div>
    </section>
  );
}
