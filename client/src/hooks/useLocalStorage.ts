import { useState, useEffect, useCallback } from 'react';

/**
 * Options for useLocalStorage hook
 */
interface UseLocalStorageOptions<T> {
  /**
   * Initial value to use if no value exists in localStorage
   */
  defaultValue: T;
  
  /**
   * Whether to parse the stored value with a custom parser
   */
  parser?: (str: string) => T;
  
  /**
   * Whether to stringify the value with a custom serializer before storing
   */
  serializer?: (value: T) => string;
  
  /**
   * Whether to skip saving the value to localStorage
   * Useful for SSR environments where localStorage is not available
   */
  skipStorage?: boolean;
  
  /**
   * Storage object to use instead of localStorage
   * Useful for testing or when using sessionStorage
   */
  storageObject?: Storage;
}

/**
 * Custom hook for using localStorage with type safety and improved error handling
 * 
 * Features:
 * - Type-safe localStorage access with TypeScript generics
 * - Synchronizes state across components using the same localStorage key
 * - Custom serialization/deserialization support
 * - Error handling with fallback to default value
 * - SSR compatibility with "skipStorage" option
 * 
 * @template T - Type of stored value
 * @param key - localStorage key
 * @param options - Configuration options
 * @returns Tuple containing current value and setter function
 * 
 * @example
 * ```tsx
 * // Basic usage with primitives
 * const [count, setCount] = useLocalStorage('count', { defaultValue: 0 });
 * 
 * // With complex objects
 * const [user, setUser] = useLocalStorage('user', { 
 *   defaultValue: { name: '', email: '' } 
 * });
 * 
 * // With custom serialization
 * const [data, setData] = useLocalStorage('data', {
 *   defaultValue: new Map(),
 *   serializer: map => JSON.stringify(Array.from(map.entries())),
 *   parser: str => new Map(JSON.parse(str))
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): [T, (value: T | ((prevValue: T) => T)) => void, () => void] {
  const {
    defaultValue,
    parser = JSON.parse,
    serializer = JSON.stringify,
    skipStorage = false,
    storageObject = typeof window !== 'undefined' ? window.localStorage : undefined
  } = options;
  
  // Check if localStorage is available
  const isStorageAvailable = useCallback(() => {
    if (skipStorage || !storageObject) return false;
    
    try {
      const testKey = '__storage_test__';
      storageObject.setItem(testKey, testKey);
      storageObject.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }, [skipStorage, storageObject]);
  
  // Get initial value from localStorage or use default
  const getInitialValue = useCallback((): T => {
    if (!isStorageAvailable()) return defaultValue;
    
    try {
      const storedValue = storageObject?.getItem(key);
      
      if (storedValue === null) {
        return defaultValue;
      }
      
      return parser(storedValue);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, parser, isStorageAvailable, storageObject]);
  
  // Initialize state with value from localStorage or default
  const [value, setValue] = useState<T>(getInitialValue);
  
  // Update localStorage when value changes
  useEffect(() => {
    if (!isStorageAvailable()) return;
    
    try {
      if (value === undefined) {
        storageObject?.removeItem(key);
      } else {
        storageObject?.setItem(key, serializer(value));
      }
      
      // Dispatch storage event for cross-component synchronization
      const event = new StorageEvent('storage', {
        key,
        newValue: value !== undefined ? serializer(value) : null,
        storageArea: storageObject
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error);
    }
  }, [key, value, serializer, isStorageAvailable, storageObject]);
  
  // Handle storage events from other components
  useEffect(() => {
    if (!isStorageAvailable()) return;
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== key || event.storageArea !== storageObject) return;
      
      try {
        const newValue = event.newValue !== null
          ? parser(event.newValue)
          : defaultValue;
        
        setValue(newValue);
      } catch (error) {
        console.error(`Error parsing storage event for key "${key}":`, error);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, parser, isStorageAvailable, storageObject]);
  
  // Function to remove the item from localStorage
  const removeItem = useCallback(() => {
    if (!isStorageAvailable()) return;
    
    try {
      storageObject?.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue, isStorageAvailable, storageObject]);
  
  return [value, setValue, removeItem];
}

export default useLocalStorage;