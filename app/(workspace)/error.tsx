"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="workspace-error" role="alert">
      <p className="eyebrow eyebrow-dark">A TEMPORARY PAUSE</p>
      <h1>We could not load this page.</h1>
      <p>Your work is safe. Try again in a moment.</p>
      <button className="button button-dark" type="button" onClick={reset}>Try again</button>
    </main>
  );
}