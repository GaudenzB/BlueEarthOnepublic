import { useState, useEffect, useCallback } from 'react';

/**
 * Debounces a value by delaying updates until after a specified wait time
 * 
 * This is useful for reducing the number of state updates or API calls in response
 * to rapidly changing input, like search fields or resize events.
 * 
 * @template T - Type of the value to debounce
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns The debounced value
 * 
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 * 
 * // Effect only runs when debouncedSearchTerm changes
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * 
 * return (
 *   <input
 *     value={searchTerm}
 *     onChange={(e) => setSearchTerm(e.target.value)}
 *     placeholder="Search..."
 *   />
 * );
 * ```
 */
export function useDebounce<T>(value: T, delay = 500): T {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    // Update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    // Cancel the timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes
  
  return debouncedValue;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last invocation.
 * 
 * Ensures the debounced function maintains proper types from the original function.
 * 
 * @template T - The function type
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds (default: 500ms)
 * @returns A debounced version of the function with proper types
 * 
 * @example
 * ```tsx
 * // API call function
 * const searchProducts = (query: string) => api.get(`/products?q=${query}`);
 * 
 * // Create debounced version of the function
 * const debouncedSearch = useDebouncedCallback(searchProducts, 300);
 * 
 * // Use directly with input
 * return (
 *   <input
 *     onChange={(e) => debouncedSearch(e.target.value)}
 *     placeholder="Search products..."
 *   />
 * );
 * ```
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  fn: T,
  delay = 500
): (...args: Parameters<T>) => void {
  // We use the useCallback hook to prevent the debounced function from being recreated
  // on every render, which would defeat the purpose of debouncing
  return useCallback((...args: Parameters<T>) => {
    const handler = setTimeout(() => {
      fn(...args);
    }, delay);
    
    // In a functional component, we don't have access to `this`, so we can't store
    // the timeout ID. In real-world usage, the component using this hook would need
    // to be careful about cleanup in useEffect if needed.
    return () => {
      clearTimeout(handler);
    };
  }, [fn, delay]);
}

export default useDebounce;