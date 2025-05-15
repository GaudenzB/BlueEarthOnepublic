import React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  /** Optional custom width class, defaults to max-w-7xl */
  maxWidthClass?: string;
  /** Optional padding classes, defaults to px-4 py-6 */
  paddingClass?: string;
  /** Whether to use grid layout instead of flex */
  useGrid?: boolean;
}

/**
 * PageLayout component that provides consistent layout structure
 * 
 * Features:
 * - Responsive container with max width
 * - Consistent padding
 * - Optional grid layout for content-heavy pages
 * - Centers content with mx-auto
 */
export function PageLayout({ 
  children, 
  maxWidthClass = "max-w-7xl", 
  paddingClass = "px-4 py-6",
  useGrid = false 
}: PageLayoutProps) {
  return (
    <div className={`container mx-auto ${paddingClass} ${maxWidthClass}`}>
      <div className={useGrid ? "grid gap-6 md:grid-cols-12" : "flex flex-col gap-6"}>
        {children}
      </div>
    </div>
  );
}