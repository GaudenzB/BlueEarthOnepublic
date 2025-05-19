import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to handle focus trapping within a component
 * 
 * @param active - Whether focus trap is active
 * @param containerRef - Ref to the container element
 * @param options - Additional options
 * @returns Functions to activate/deactivate the focus trap
 * 
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * const { activate, deactivate } = useFocusTrap(isOpen, modalRef);
 * 
 * useEffect(() => {
 *   if (isOpen) {
 *     activate();
 *   } else {
 *     deactivate();
 *   }
 * }, [isOpen, activate, deactivate]);
 * 
 * return (
 *   <div ref={modalRef} role="dialog">
 *     <button>Close</button>
 *     <input type="text" />
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(
  active: boolean = false,
  containerRef: React.RefObject<HTMLElement>,
  options: {
    initialFocus?: React.RefObject<HTMLElement>;
    restoreFocus?: boolean;
    escapeDeactivates?: boolean;
  } = {}
) {
  const {
    initialFocus,
    restoreFocus = true,
    escapeDeactivates = true
  } = options;
  
  // Store previously focused element to restore focus when trap is deactivated
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Find all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      // Filter out disabled or hidden elements
      const element = el as HTMLElement;
      return (
        !element.hasAttribute('disabled') && 
        !element.hasAttribute('aria-hidden') &&
        element.style.display !== 'none' &&
        element.style.visibility !== 'hidden'
      );
    }) as HTMLElement[];
  }, [containerRef]);
  
  // Focus first focusable element or a specific element if provided
  const focusFirst = useCallback(() => {
    if (initialFocus?.current) {
      initialFocus.current.focus();
      return;
    }
    
    const focusable = getFocusableElements();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else if (containerRef.current) {
      // If no focusable elements, focus the container itself
      containerRef.current.setAttribute('tabindex', '-1');
      containerRef.current.focus();
    }
  }, [containerRef, getFocusableElements, initialFocus]);
  
  // Handle tab key to keep focus within the container
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current) return;
    
    // Handle escape key if enabled
    if (escapeDeactivates && e.key === 'Escape') {
      setActive(false);
      return;
    }
    
    // Only handle tab key
    if (e.key !== 'Tab') return;
    
    const focusable = getFocusableElements();
    if (focusable.length === 0) return;
    
    // Get the first and last focusable elements
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];
    
    // Safety check to ensure elements exist
    if (!firstFocusable || !lastFocusable) return;
    
    // If shift + tab on first element, move to last element
    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
    // If tab on last element, move to first element
    else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }, [containerRef, escapeDeactivates, getFocusableElements]);
  
  // State to track if focus trap is active
  const [isActive, setActive] = useState(active);
  
  // Activate focus trap
  const activate = useCallback(() => {
    if (!containerRef.current) return;
    
    // Store current active element
    previousFocusRef.current = document.activeElement as HTMLElement;
    
    // Add keydown event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Move focus inside the trap
    focusFirst();
    
    setActive(true);
  }, [containerRef, focusFirst, handleKeyDown]);
  
  // Deactivate focus trap
  const deactivate = useCallback(() => {
    // Remove event listener
    document.removeEventListener('keydown', handleKeyDown);
    
    // Restore focus to previously focused element
    if (restoreFocus && previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
    
    setActive(false);
  }, [handleKeyDown, restoreFocus]);
  
  // Setup or teardown focus trap based on active prop
  useEffect(() => {
    if (active) {
      activate();
    } else {
      deactivate();
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, activate, deactivate, handleKeyDown]);
  
  return {
    isActive,
    activate,
    deactivate,
    focusFirst
  };
}

/**
 * Custom hook for setting focus on specific elements or restoring focus
 * 
 * @returns Object containing focus handling functions
 * 
 * @example
 * ```tsx
 * const { setFocus, getPreviousFocus, restoreFocus } = useFocusManagement();
 * 
 * // When opening a modal
 * const openModal = () => {
 *   getPreviousFocus(); // Store current focus
 *   setIsOpen(true);
 *   // Later, you can focus a specific element
 *   setFocus(inputRef.current);
 * };
 * 
 * // When closing a modal
 * const closeModal = () => {
 *   setIsOpen(false);
 *   restoreFocus(); // Restore focus to previous element
 * };
 * ```
 */
export function useFocusManagement() {
  // Store the previously focused element
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  // Get and store the currently focused element
  const getPreviousFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
    return previousFocusRef.current;
  }, []);
  
  // Set focus to a specific element
  const setFocus = useCallback((element: HTMLElement | null) => {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }, []);
  
  // Restore focus to the previously focused element
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
      previousFocusRef.current.focus();
    }
  }, []);
  
  return { setFocus, getPreviousFocus, restoreFocus };
}

/**
 * Custom hook to check if current user is navigating with keyboard
 * 
 * @returns True if user is using keyboard navigation
 * 
 * @example
 * ```tsx
 * const isKeyboardUser = useKeyboardUser();
 * 
 * return (
 *   <button className={isKeyboardUser ? 'focus-visible' : 'focus-not-visible'}>
 *     Click me
 *   </button>
 * );
 * ```
 */
export function useKeyboardUser() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab key indicates keyboard navigation
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };
    
    const handleMouseDown = () => {
      // Mouse interaction indicates not keyboard navigation
      setIsKeyboardUser(false);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);
  
  return isKeyboardUser;
}

/**
 * Custom hook to announce messages to screen readers
 * 
 * @param options - Configuration options
 * @returns Function to announce messages
 * 
 * @example
 * ```tsx
 * const announce = useAnnounce();
 * 
 * const handleLoad = () => {
 *   // Load data...
 *   announce('Data loaded successfully');
 * };
 * 
 * const handleError = () => {
 *   announce('Error loading data', 'assertive');
 * };
 * ```
 */
export function useAnnounce(options: {
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
} = {}) {
  const {
    politeness = 'polite',
    clearAfter = 5000
  } = options;
  
  // Reference to announcement element
  const elementRef = useRef<HTMLDivElement | null>(null);
  // Reference to timeout for cleanup
  const timeoutRef = useRef<number | null>(null);
  
  // Create live region on mount if it doesn't exist
  useEffect(() => {
    if (!elementRef.current) {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.className = 'sr-only';
      
      // Style for screen reader only
      Object.assign(liveRegion.style, {
        border: '0',
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: '0',
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap'
      });
      
      document.body.appendChild(liveRegion);
      elementRef.current = liveRegion;
    }
    
    // Clean up on unmount
    return () => {
      if (elementRef.current) {
        document.body.removeChild(elementRef.current);
      }
      
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [politeness]);
  
  // Announce a message to screen readers
  const announce = useCallback((message: string, announcePoliteness?: 'polite' | 'assertive') => {
    if (!elementRef.current) return;
    
    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Set politeness if it's different from the default
    if (announcePoliteness && announcePoliteness !== politeness) {
      elementRef.current.setAttribute('aria-live', announcePoliteness);
    }
    
    // Set the message
    elementRef.current.textContent = message;
    
    // Clear the message after a delay to prevent stacking announcements
    timeoutRef.current = window.setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.textContent = '';
        
        // Reset politeness if it was changed
        if (announcePoliteness && announcePoliteness !== politeness) {
          elementRef.current.setAttribute('aria-live', politeness);
        }
      }
      
      timeoutRef.current = null;
    }, clearAfter);
  }, [clearAfter, politeness]);
  
  return announce;
}

/**
 * Main accessibility hook that combines multiple a11y hooks
 * 
 * @returns Object containing various accessibility utilities
 * 
 * @example
 * ```tsx
 * const { 
 *   focusTrap, 
 *   focusManagement, 
 *   isKeyboardUser, 
 *   announce 
 * } = useA11y();
 * 
 * // Use these utilities in your component
 * ```
 */
export function useA11y() {
  // Hook to check if user is using keyboard navigation
  const isKeyboardUser = useKeyboardUser();
  
  // Create focus management utilities
  const focusManagement = useFocusManagement();
  
  // Create screen reader announcement utility
  const announce = useAnnounce();
  
  return {
    isKeyboardUser,
    focusManagement,
    useFocusTrap, // Expose as a nested hook
    announce
  };
}

export default useA11y;