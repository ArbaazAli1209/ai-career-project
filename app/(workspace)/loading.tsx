export default function WorkspaceLoading() {
  return (
    <div className="dashboard-page workspace-loading" role="status" aria-live="polite">
      <span className="eyebrow eyebrow-dark">LOADING YOUR CAREER SPACE</span>
      <div className="loading-line loading-title" />
      <div className="loading-line" />
      <div className="loading-block" />
      <span className="sr-only">Loading your career workspace</span>
    </div>
  );
}