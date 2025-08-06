import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

const FlaskIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 2v6l-3 7c-.5 1.5-.5 3.5 1 4.5h10c1.5-1 1.5-3 1-4.5L15 8V2" />
    <path d="M9 2h6" />
    <circle cx="12" cy="14" r="2" />
  </svg>
);

export default FlaskIcon;
