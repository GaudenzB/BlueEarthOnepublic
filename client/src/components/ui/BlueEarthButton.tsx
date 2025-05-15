/**
 * BlueEarthButton Component
 * 
 * A themed button component that follows the BlueEarth design system
 */

import React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Our custom size types
export type BlueEarthSize = "xs" | "sm" | "md" | "lg" | "xl";

// We use the same variant types as the Button component
export type BlueEarthVariant = ButtonProps["variant"];

// Extended props interface
export interface BlueEarthButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
  size?: BlueEarthSize;
  variant?: BlueEarthVariant;
  children?: React.ReactNode;
  className?: string;
}

export function BlueEarthButton({
  className,
  size = "md",
  variant = "default",
  children,
  ...props
}: BlueEarthButtonProps) {
  // Size-specific padding based on our spacing tokens
  const sizeClasses = {
    xs: "px-1 py-1 text-xs",
    sm: "px-2 py-1 text-sm",
    md: "px-3 py-2 text-base",
    lg: "px-4 py-3 text-lg",
    xl: "px-6 py-4 text-xl",
  };

  // Map our custom sizes to the built-in Button sizes for proper sizing
  const buttonSize: ButtonProps["size"] = 
    size === "sm" || size === "xs" ? "sm" :
    size === "lg" || size === "xl" ? "lg" : 
    "default";

  // Get the correct size class from our mapping
  const sizeClass = sizeClasses[size];

  return (
    <Button
      className={cn(sizeClass, className)}
      size={buttonSize}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );
}

/**
 * Example usage:
 * 
 * <BlueEarthButton
 *   size="md"
 *   variant="default"
 *   onClick={() => console.log("Button clicked")}
 * >
 *   Submit
 * </BlueEarthButton>
 */