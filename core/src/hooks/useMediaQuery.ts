import { useState, useEffect } from 'react';

/**
 * A hook for responsive design that detects if a media query matches
 * @param query CSS media query string (e.g., '(min-width: 768px)')
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state or false for SSR
  const getMatches = (): boolean => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // State and setter for matched state
  const [matches, setMatches] = useState<boolean>(getMatches());

  // Handle change event
  useEffect(() => {
    // Handle changes
    const handleChange = () => {
      setMatches(getMatches());
    };
    
    // Create a media query list
    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    handleChange();
    
    // Listen for changes
    // Using the standard addListener for wider compatibility
    // but could use addEventListener on newer browsers
    mediaQueryList.addEventListener('change', handleChange);
    
    // Remove listener on cleanup
    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query, getMatches]); // Re-run if query or getMatches changes

  return matches;
}

/**
 * Common breakpoints for responsive design
 */
export const breakpoints = {
  xs: '(min-width: 0px)',     // Mobile phones
  sm: '(min-width: 640px)',   // Small tablets
  md: '(min-width: 768px)',   // Tablets
  lg: '(min-width: 1024px)',  // Desktops
  xl: '(min-width: 1280px)',  // Large desktops
  '2xl': '(min-width: 1536px)', // Extra large desktops
};

/**
 * Convenience hooks for common breakpoints
 */
export const useIsMobile = () => !useMediaQuery(breakpoints.md);
export const useIsTablet = () => useMediaQuery(breakpoints.md) && !useMediaQuery(breakpoints.lg);
export const useIsDesktop = () => useMediaQuery(breakpoints.lg);