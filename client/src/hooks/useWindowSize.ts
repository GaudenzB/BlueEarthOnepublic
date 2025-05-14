import { useState, useEffect } from 'react';

/**
 * Interface for window dimensions
 */
export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that tracks the window size
 * 
 * This hook provides the current window dimensions and updates when the window is resized.
 * Useful for responsive layouts and conditional rendering based on screen size.
 * 
 * @returns WindowSize object containing width and height
 * 
 * @example
 * ```tsx
 * const { width, height } = useWindowSize();
 * 
 * return (
 *   <div>
 *     {width < 768 ? <MobileComponent /> : <DesktopComponent />}
 *   </div>
 * );
 * ```
 */
export function useWindowSize(): WindowSize {
  // Initialize with undefined to consider SSR
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures effect runs only on mount and unmount

  return windowSize;
}

// Breakpoint helpers (matching Tailwind's default breakpoints)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Checks if the current window width is below a given breakpoint
 * 
 * @param windowWidth - Current window width
 * @param breakpoint - Breakpoint to check against
 * @returns True if window width is less than the breakpoint
 */
export function isBelowBreakpoint(windowWidth: number, breakpoint: keyof typeof BREAKPOINTS): boolean {
  return windowWidth < BREAKPOINTS[breakpoint];
}

export default useWindowSize;