import { useCallback, useEffect, useState } from 'react';

/**
 * Interface for accessibility state
 */
export interface A11yState {
  /** Whether the user is navigating with a keyboard */
  isNavigatingWithKeyboard: boolean;
  
  /** Whether the user prefers reduced motion */
  prefersReducedMotion: boolean;
  
  /** Whether the user prefers a high contrast mode */
  prefersHighContrast: boolean;
  
  /** Whether the page is zoomed above a threshold */
  isZoomed: boolean;
  
  /** Whether a screen reader is potentially being used */
  isUsingScreenReader: boolean;
}

/**
 * Hook that provides accessibility-related state information
 * 
 * This hook helps in building more accessible applications by providing
 * information about user preferences and navigation methods.
 * 
 * @returns A11yState object containing accessibility information
 * 
 * @example
 * ```tsx
 * const { isNavigatingWithKeyboard, prefersReducedMotion } = useA11y();
 * 
 * return (
 *   <div>
 *     {isNavigatingWithKeyboard && <FocusIndicator />}
 *     <Button animate={!prefersReducedMotion} />
 *   </div>
 * );
 * ```
 */
export function useA11y(): A11yState {
  // Track if user is navigating with keyboard
  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(false);
  
  // Track if user prefers reduced motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false
  );
  
  // Track if user prefers high contrast
  const [prefersHighContrast, setPrefersHighContrast] = useState(
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-contrast: more)').matches
      : false
  );
  
  // Track if page is zoomed (approximation)
  const [isZoomed, setIsZoomed] = useState(
    typeof window !== 'undefined'
      ? window.devicePixelRatio > 1.5
      : false
  );
  
  // Estimate if a screen reader might be in use
  // Note: This is a heuristic and not 100% reliable
  const [isUsingScreenReader, setIsUsingScreenReader] = useState(false);
  
  // Handler for keyboard navigation detection
  const handleFirstTab = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      setIsNavigatingWithKeyboard(true);
      // Remove listener after first detection
      window.removeEventListener('keydown', handleFirstTab);
    }
  }, []);
  
  // Reset keyboard navigation on mouse use
  const handleMouseDown = useCallback(() => {
    setIsNavigatingWithKeyboard(false);
    // Re-add the keyboard listener
    window.addEventListener('keydown', handleFirstTab);
  }, [handleFirstTab]);
  
  // Check for potential screen reader usage
  const checkForScreenReader = useCallback(() => {
    // Look for common screen reader artifacts
    const hasFocusIndicators = document.querySelectorAll('[role="alert"], [aria-live]').length > 0;
    const hasScreenReaderOnlyText = document.querySelectorAll('.sr-only, .screen-reader-text').length > 0;
    
    // Set flag if indicators are found
    if (hasFocusIndicators || hasScreenReaderOnlyText) {
      setIsUsingScreenReader(true);
    }
  }, []);
  
  // Set up event listeners
  useEffect(() => {
    // Detect keyboard navigation
    window.addEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDown);
    
    // Handle reduced motion preference
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionHandler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionMediaQuery.addEventListener('change', motionHandler);
    
    // Handle contrast preference
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: more)');
    const contrastHandler = (e: MediaQueryListEvent) => setPrefersHighContrast(e.matches);
    contrastMediaQuery.addEventListener('change', contrastHandler);
    
    // Detect potential screen reader usage after a delay
    const screenReaderCheckTimeout = setTimeout(() => {
      checkForScreenReader();
    }, 1000);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
      motionMediaQuery.removeEventListener('change', motionHandler);
      contrastMediaQuery.removeEventListener('change', contrastHandler);
      clearTimeout(screenReaderCheckTimeout);
    };
  }, [handleFirstTab, handleMouseDown, checkForScreenReader]);
  
  return {
    isNavigatingWithKeyboard,
    prefersReducedMotion,
    prefersHighContrast,
    isZoomed,
    isUsingScreenReader
  };
}

export default useA11y;