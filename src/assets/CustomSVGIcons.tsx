export const DocumentIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 4h16v10l-4 2c-2 1-4 2-8 2s-4-2-4-4V4z" />
  </svg>
);

export const TrapezoidIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7 5h10l5 14H2L7 5z" />
  </svg>
);

export const EllipseIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <ellipse cx="12" cy="12" rx="10" ry="7" />
  </svg>
);

export const ParallelogramIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M7 5h12l-4 14H3L7 5z" />
  </svg>
);

export const PathStraightIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 19L19 5" />
    <circle cx="5" cy="19" r="2" fill={color} stroke="none" />
    <circle cx="19" cy="5" r="2" fill={color} stroke="none" />
  </svg>
);

export const PathElbowIcon = ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 19V12H19V5" />
    <circle cx="5" cy="19" r="2" fill={color} stroke="none" />
    <circle cx="19" cy="5" r="2" fill={color} stroke="none" />
  </svg>
);
