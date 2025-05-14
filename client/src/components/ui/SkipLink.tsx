import React from 'react';
import { tokens } from '@/theme/tokens';

/**
 * Props for SkipLink component
 */
export interface SkipLinkProps {
  /**
   * Target ID to skip to
   */
  targetId: string;
  
  /**
   * Link text
   */
  text?: string;
  
  /**
   * Optional z-index value
   */
  zIndex?: number;
  
  /**
   * Optional className
   */
  className?: string;
}

/**
 * SkipLink Component
 * 
 * A visually hidden link that becomes visible on focus, allowing keyboard users 
 * to skip navigation and other repetitive elements to go directly to main content.
 * This is an important accessibility feature for keyboard-only users.
 * 
 * This link should be one of the first elements in the DOM (ideally the first focusable element).
 * 
 * @example
 * ```tsx
 * // Place at the top of your layout
 * <SkipLink targetId="main-content" />
 * 
 * // Then somewhere in your layout:
 * <main id="main-content">
 *   {children}
 * </main>
 * ```
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  text = 'Skip to main content',
  zIndex = 9999,
  className = ''
}) => {
  // Handle click event
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Find the target element
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
      // Focus the element
      targetElement.focus();
      
      // Put the element into view
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`
        block absolute left-2 top-2 p-3 
        bg-white text-blue-700 font-medium 
        border-2 border-blue-700 rounded shadow-md
        transform -translate-y-full focus:translate-y-0
        transition-transform duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500
        ${className}
      `}
      style={{
        zIndex,
        // Apply design system tokens
        borderRadius: tokens.radii.md,
        fontFamily: tokens.typography.fontFamily.sans,
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.brand.primary,
        backgroundColor: tokens.colors.neutral[100],
        boxShadow: tokens.boxShadow.md
      }}
    >
      {text}
    </a>
  );
};

export default SkipLink;