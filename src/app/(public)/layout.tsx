
'use client';

// This layout is for public-facing pages that should not have the main app sidebar and header.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

    