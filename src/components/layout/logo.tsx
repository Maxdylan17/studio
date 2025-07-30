
import Link from "next/link";

export function Logo() {
  return (
    (<div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-primary"
      >
        <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
        <path d="M12 3v18" />
        <path d="M2 9h20" />
      </svg>
      <h1 className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
        FiscalFlow
      </h1>
    </div>)
  );
}
