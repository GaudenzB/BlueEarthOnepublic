/**
 * BlueEarthCard Component
 * 
 * A themed card component that follows the BlueEarth design system
 */

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { themeClass } from "@/lib/theme-utils";

interface BlueEarthCardProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "elevated";
}

export function BlueEarthCard({
  title,
  description,
  children,
  footer,
  className,
  variant = "default",
}: BlueEarthCardProps) {
  // Define the variant-specific classes
  const variantClasses = {
    default: "",
    outline: "border-2 shadow-none",
    elevated: "shadow-md hover:shadow-lg transition-shadow duration-200",
  };

  return (
    <Card className={themeClass(variantClasses[variant], className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      {children && <CardContent>{children}</CardContent>}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

/**
 * Example usage:
 * 
 * <BlueEarthCard
 *   title="Document Overview"
 *   description="Recent uploads and statistics"
 *   variant="elevated"
 * >
 *   <p>Content goes here</p>
 * </BlueEarthCard>
 */