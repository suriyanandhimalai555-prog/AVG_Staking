import React from "react";

const Base = ({ children }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const MailIcon = () => (
  <Base>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4 7l8 6 8-6" />
  </Base>
);

export const LockIcon = () => (
  <Base>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Base>
);

export const UserIcon = () => (
  <Base>
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5.5 19c1.7-4 11.3-4 13 0" />
  </Base>
);

export const PhoneIcon = () => (
  <Base>
    <path d="M8 3.5h2.4l1.2 4.2-1.8 1.1c1.2 2.8 3.4 5 6.2 6.2l1.1-1.8 4.2 1.2V17c0 1.1-.9 2-2 2C10 19 5 14 5 7c0-1.1.9-2 2-2z" />
  </Base>
);

export const EyeIcon = () => (
  <Base>
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
    <circle cx="12" cy="12" r="3" />
  </Base>
);

export const EyeOffIcon = () => (
  <Base>
    <path d="M3 3l18 18" />
    <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
    <path d="M9.7 5.3C11 5.1 11.9 5 12 5c6.5 0 10 7 10 7a19.4 19.4 0 0 1-3.7 4.5" />
    <path d="M6.2 7.1C3.8 9 2 12 2 12s3.5 7 10 7c1.2 0 2.3-.2 3.3-.5" />
  </Base>
);