export function BullRunLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L9 5h6l-3-3z" />
      <path d="M18 10v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4" />
      <path d="M14 10s-1-1.5-2-1.5S10 10 10 10" />
      <path d="M14 14v-2" />
      <path d="M10 14v-2" />
      <path d="M3.5 10H6v4H3.5a1.5 1.5 0 010-3z" />
      <path d="M20.5 10H18v4h2.5a1.5 1.5 0 000-3z" />
      <path d="M6 5c-2.5 0-4 1.5-4 4" />
      <path d="M18 5c2.5 0 4 1.5 4 4" />
    </svg>
  );
}
