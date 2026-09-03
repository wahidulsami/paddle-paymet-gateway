export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="32" height="32" rx="8" fill="#10b981" />
      <path
        d="M9 10.5C9 9.67 9.67 9 10.5 9H18C20.76 9 23 11.24 23 14C23 16.76 20.76 19 18 19H13V22.5C13 23.33 12.33 24 11.5 24H10.5C9.67 24 9 23.33 9 22.5V10.5ZM13 16H18C19.1 16 20 15.1 20 14C20 12.9 19.1 12 18 12H13V16Z"
        fill="white"
      />
    </svg>
  );
}
