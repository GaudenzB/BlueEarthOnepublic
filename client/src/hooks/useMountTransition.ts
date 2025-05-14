import { useState, useEffect } from 'react';

/**
 * Interface for useMountTransition hook options
 */
interface UseMountTransitionOptions {
  /**
   * Initial state of the transition
   */
  initialState?: boolean;
  
  /**
   * Duration of the transition in milliseconds
   */
  transitionDuration: number;
  
  /**
   * Whether the component is currently mounted
   */
  isMounted: boolean;
  
  /**
   * Additional delay before starting transition out (optional)
   */
  exitDelay?: number;
  
  /**
   * Class name prefix
   */
  classPrefix?: string;
}

/**
 * Interface for useMountTransition hook return value
 */
interface UseMountTransitionResult {
  /**
   * Whether the component should be shown in the DOM
   */
  isShown: boolean;
  
  /**
   * Current transition class name
   */
  mountClass: string;
}

/**
 * Hook for managing mount/unmount transitions
 * 
 * This hook helps manage the animation states when a component
 * is being mounted or unmounted from the DOM. It ensures proper
 * timing between state changes and CSS transitions.
 * 
 * @param options - Configuration options for the transition
 * @returns Object containing isShown state and current CSS class
 * 
 * @example
 * ```tsx
 * const { isShown, mountClass } = useMountTransition({
 *   initialState: false,
 *   transitionDuration: 300,
 *   isMounted: isModalOpen,
 *   classPrefix: 'modal'
 * });
 * 
 * // In your render:
 * return isShown ? (
 *   <div className={`modal ${mountClass}`}>
 *     Modal content
 *   </div>
 * ) : null;
 * ```
 */
export function useMountTransition({
  initialState = false,
  transitionDuration,
  isMounted,
  exitDelay = 0,
  classPrefix = 'toast'
}: UseMountTransitionOptions): UseMountTransitionResult {
  // Whether the component should be in the DOM
  const [isShown, setIsShown] = useState(initialState && isMounted);
  
  // Current state of the transition
  const [transitionState, setTransitionState] = useState<'enter' | 'enter-active' | 'exit' | 'exit-active'>(
    initialState && isMounted ? 'enter-active' : 'exit'
  );
  
  // Manage mounting and unmounting based on isMounted prop
  useEffect(() => {
    let entryTimeout: NodeJS.Timeout;
    let exitTimeout: NodeJS.Timeout;
    
    if (isMounted) {
      // Component is being mounted
      setIsShown(true);
      
      // Schedule the active state to happen after a frame to ensure enter class applies first
      entryTimeout = setTimeout(() => {
        setTransitionState('enter-active');
      }, 10); // Small delay to ensure browser has painted the initial state
    } else {
      // Component is being unmounted
      
      // Add exit delay if specified
      const delayedExit = () => {
        // Start exit animation
        setTransitionState('exit-active');
        
        // After animation completes, remove from DOM
        exitTimeout = setTimeout(() => {
          setIsShown(false);
        }, transitionDuration);
      };
      
      // Apply exit class first
      setTransitionState('exit');
      
      // If there's an exit delay, wait before starting the transition
      if (exitDelay > 0) {
        exitTimeout = setTimeout(delayedExit, exitDelay);
      } else {
        delayedExit();
      }
    }
    
    // Clean up timers
    return () => {
      clearTimeout(entryTimeout);
      clearTimeout(exitTimeout);
    };
  }, [isMounted, transitionDuration, exitDelay]);
  
  // Convert transition state to a CSS class name
  const mountClass = `${classPrefix}-${transitionState.split('-')[0]}${
    transitionState.includes('active') ? '-active' : ''
  }`;
  
  return { isShown, mountClass };
}

export default useMountTransition;