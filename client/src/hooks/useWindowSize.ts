import { useState, useEffect } from 'react';
import { tokens } from '@/theme/tokens';

export interface WindowSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * Hook to track window dimensions and current responsive breakpoint
 * 
 * This hook returns the current window dimensions and boolean flags
 * indicating which responsive breakpoint is active. This is useful for
 * conditional rendering based on screen size.
 * 
 * @returns WindowSize object containing width, height, and breakpoint information
 * 
 * @example
 * ```tsx
 * const { width, height, isMobile, isTablet, isDesktop, breakpoint } = useWindowSize();
 * 
 * // Conditional rendering based on screen size
 * return (
 *   <div>
 *     {isMobile ? (
 *       <MobileNavigation />
 *     ) : (
 *       <DesktopNavigation />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useWindowSize(): WindowSize {
  // Create a stable reference for breakpoints
  // These values will be stable across renders since tokens is imported at module level
  const breakpoints = {
    xs: parseInt(tokens.breakpoints.xs, 10),
    sm: parseInt(tokens.breakpoints.sm, 10),
    md: parseInt(tokens.breakpoints.md, 10),
    lg: parseInt(tokens.breakpoints.lg, 10),
    xl: parseInt(tokens.breakpoints.xl, 10),
    '2xl': parseInt(tokens.breakpoints['2xl'], 10)
  };
  
  // Set initial window size
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    breakpoint: 'lg'
  });
  
  useEffect(() => {
    // Skip in SSR environment
    if (typeof window === 'undefined') {
      return undefined;
    }
    
    // Handler to call on window resize
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determine current breakpoint
      let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
      
      if (width < breakpoints.sm) {
        breakpoint = 'xs';
      } else if (width < breakpoints.md) {
        breakpoint = 'sm';
      } else if (width < breakpoints.lg) {
        breakpoint = 'md';
      } else if (width < breakpoints.xl) {
        breakpoint = 'lg';
      } else if (width < breakpoints['2xl']) {
        breakpoint = 'xl';
      } else {
        breakpoint = '2xl';
      }
      
      // Set boolean flags for common device categories
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.xl;
      const isDesktop = width >= breakpoints.xl;
      
      setWindowSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        breakpoint
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away on mount to set initial size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoints]); // Include breakpoints as a dependency
  
  return windowSize;
}

export default useWindowSize;