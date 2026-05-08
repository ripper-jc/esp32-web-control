const icons: Record<string, string> = {
  light: "M12 2a7 7 0 00-4 12.7V17a1 1 0 001 1h6a1 1 0 001-1v-2.3A7 7 0 0012 2zM9 21h6",
  fan: "M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0 M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83",
  sensor: "M12 8v4l3 3 M3 12a9 9 0 1018 0 9 9 0 10-18 0",
  door: "M3 21V3h18v18H3zM9 12h.01",
  pir: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0",
  relay: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  thermostat: "M14 14.76V3a2 2 0 10-4 0v11.76a4 4 0 104 0z",
  plug: "M12 2v6 M8 2v6 M4 8h16v2a8 8 0 11-16 0V8z",
  default: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
};

function getDeviceIcon(categories: string[]): string {
  for (const cat of categories) {
    if (icons[cat]) return icons[cat];
  }
  return icons.default;
}

export default function DeviceIcon({ categories, className = "w-5 h-5" }: { categories: string[]; className?: string }) {
  const path = getDeviceIcon(categories);
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export { getDeviceIcon };
