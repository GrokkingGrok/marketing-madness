export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="var(--accent)" />
      <g fill="var(--accent-light)">
        <rect x="4" y="5" width="11" height="3.2" rx="1" />
        <rect x="16.4" y="5" width="3.2" height="3.2" rx="0.7" />
        <rect x="20.8" y="5" width="3.2" height="3.2" rx="0.7" />
        <rect x="25.2" y="5" width="3.2" height="3.2" rx="0.7" />
        <rect x="4" y="10" width="11" height="3.2" rx="1" />
        <rect x="16.4" y="10" width="3.2" height="3.2" rx="0.7" />
        <rect x="20.8" y="10" width="3.2" height="3.2" rx="0.7" />
        <rect x="25.2" y="10" width="3.2" height="3.2" rx="0.7" />
        <rect x="4" y="15" width="11" height="3.2" rx="1" />
        <rect x="16.4" y="15" width="3.2" height="3.2" rx="0.7" />
        <rect x="20.8" y="15" width="3.2" height="3.2" rx="0.7" />
        <rect x="25.2" y="15" width="3.2" height="3.2" rx="0.7" />
        <rect x="4" y="20" width="11" height="3.2" rx="1" />
        <rect x="16.4" y="20" width="3.2" height="3.2" rx="0.7" />
        <rect x="20.8" y="20" width="3.2" height="3.2" rx="0.7" />
        <rect x="25.2" y="20" width="3.2" height="3.2" rx="0.7" />
        <rect x="4" y="25" width="11" height="3.2" rx="1" />
        <rect x="16.4" y="25" width="3.2" height="3.2" rx="0.7" />
        <rect x="20.8" y="25" width="3.2" height="3.2" rx="0.7" />
        <rect x="25.2" y="25" width="3.2" height="3.2" rx="0.7" />
      </g>
    </svg>
  );
}
