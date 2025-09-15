import { useTheme } from 'next-themes';
import type { SVGProps } from 'react';
import { useState, useEffect } from 'react';

const DataSightLogo = (props: SVGProps<SVGSVGElement>) => {
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState('#1F2937');

  useEffect(() => {
    setColor(resolvedTheme === 'dark' ? '#E5E7EB' : '#1F2937');
  }, [resolvedTheme]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 21.5C17.2467 21.5 21.5 17.2467 21.5 12C21.5 6.75329 17.2467 2.5 12 2.5C6.75329 2.5 2.5 6.75329 2.5 12C2.5 17.2467 6.75329 21.5 12 21.5Z" />
      <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" />
      <path d="M12 12C12 10 13 10 14 11C14.5 11.5 15 12.5 13.5 13.5C12.5 14.5 12 14 12 12Z" fill={color} />
    </svg>
  );
};

export default DataSightLogo;
