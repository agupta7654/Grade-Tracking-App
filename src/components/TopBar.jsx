export default function TopBar({ back, backLabel, title, right }) {
  return (
    <div className="topbar">
      <a className="back" href={back}>
        <svg width="10" height="17" viewBox="0 0 10 17" aria-hidden="true">
          <path d="M8.5 1.5 2 8.5l6.5 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {backLabel}
      </a>
      <span className="topbar-title">{title}</span>
      <span className="topbar-right">{right}</span>
    </div>
  );
}
