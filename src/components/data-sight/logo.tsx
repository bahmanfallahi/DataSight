import type { SVGProps } from 'react';

const DataSightLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
    <circle cx="12" cy="12" r="2" fill="currentColor" className="text-accent" />
    <path d="M21 21H3" />
  </svg>
);

export default DataSightLogo;
