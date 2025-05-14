import { useState, useEffect } from 'react';

/**
 * Window size information
 */
interface WindowSize {
  /**
   * Window width in pixels
   */
  width: number;
  
  /**
   * Window height in pixels
   */
  height: number;
  
  /**
   * Whether the window is in a mobile viewport
   * Default breakpoint is 768px
   */
  isMobile: boolean;
  
  /**
   * Whether the window is in a tablet viewport
   * Between 768px and 1024px by default
   */
  isTablet: boolean;
  
  /**
   * Whether the window is in a desktop viewport
   * Default breakpoint is 1024px
   */
  isDesktop: boolean;
}

/**
 * Hook options
 */
interface UseWindowSizeOptions {
  /**
   * Breakpoint for mobile devices (in pixels)
   */
  mobileBreakpoint?: number;
  
  /**
   * Breakpoint for tablet devices (in pixels)
   */
  tabletBreakpoint?: number;
  
  /**
   * Debounce delay for resize events (in milliseconds)
   */
  debounceDelay?: number;
}

/**
 * Default window size for SSR environments
 */
const DEFAULT_WINDOW_SIZE: WindowSize = {
  width: 1200,
  height: 800,
  isMobile: false,
  isTablet: false,
  isDesktop: true
};

/**
 * Hook to track window size and responsive breakpoints
 * 
 * This hook provides the current window dimensions and boolean flags
 * for different device sizes, making it easy to implement responsive
 * behavior in components.
 * 
 * @param options - Configuration options
 * @returns Window size information
 * 
 * @example
 * ```tsx
 * const { width, height, isMobile, isTablet, isDesktop } = useWindowSize();
 * 
 * return (
 *   <div>
 *     {isMobile ? (
 *       <MobileLayout />
 *     ) : isTablet ? (
 *       <TabletLayout />
 *     ) : (
 *       <DesktopLayout />
 *     )}
 *   </div>
 * );
 * ```
 */
export function useWindowSize(options: UseWindowSizeOptions = {}): WindowSize {
  const {
    mobileBreakpoint = 768,
    tabletBreakpoint = 1024,
    debounceDelay = 250
  } = options;
  
  // Initialize with default state (for SSR)
  const [windowSize, setWindowSize] = useState<WindowSize>(DEFAULT_WINDOW_SIZE);
  
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return;
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Function to update window size
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({
        width,
        height,
        isMobile: width < mobileBreakpoint,
        isTablet: width >= mobileBreakpoint && width < tabletBreakpoint,
        isDesktop: width >= tabletBreakpoint
      });
    };
    
    // Debounced resize handler
    const handleResize = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(updateSize, debounceDelay);
    };
    
    // Add event listener for resize
    window.addEventListener('resize', handleResize);
    
    // Initial update
    updateSize();
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [mobileBreakpoint, tabletBreakpoint, debounceDelay]);
  
  return windowSize;
}

export default useWindowSize;