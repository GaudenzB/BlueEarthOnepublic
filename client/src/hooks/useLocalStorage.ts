import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

type StorageValue<T> = T | null;

type SetValue<T> = Dispatch<SetStateAction<StorageValue<T>>>;

interface UseLocalStorageOptions<T> {
  /**
   * Function to serialize the value before storing
   */
  serializer?: (value: StorageValue<T>) => string;
  
  /**
   * Function to deserialize the value when retrieving
   */
  deserializer?: (value: string) => StorageValue<T>;
  
  /**
   * Initial value to use if no value exists in storage
   */
  initialValue?: StorageValue<T>;
  
  /**
   * Event to listen for storage changes
   */
  listenToStorageChanges?: boolean;
  
  /**
   * Optional error handler
   */
  onError?: (error: unknown) => void;
}

/**
 * Custom hook for accessing and manipulating localStorage values with type safety
 * 
 * @param key - localStorage key to manage
 * @param options - Configuration options
 * @returns Tuple containing current value and setter function
 * 
 * @example
 * ```tsx
 * // Basic usage with default options
 * const [count, setCount] = useLocalStorage<number>('count', { initialValue: 0 });
 * 
 * // Increment the count and automatically update localStorage
 * const incrementCount = () => setCount(prev => (prev || 0) + 1);
 * 
 * // Advanced usage with custom serialization/deserialization
 * const [user, setUser] = useLocalStorage<User>('user', {
 *   initialValue: null,
 *   serializer: (user) => user ? JSON.stringify(user) : '',
 *   deserializer: (str) => str ? JSON.parse(str) : null,
 *   onError: (err) => console.error('Failed to parse user data', err)
 * });
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T> = {}
): [StorageValue<T>, SetValue<T>] {
  const {
    initialValue = null,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    listenToStorageChanges = true,
    onError = console.error
  } = options;
  
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<StorageValue<T>>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue if storage is empty
      return item ? deserializer(item) as StorageValue<T> : initialValue;
    } catch (error) {
      // If error also return initialValue
      onError(error);
      return initialValue;
    }
  });
  
  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = useCallback((value: SetStateAction<StorageValue<T>>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Skip localStorage for server-side rendering
      if (typeof window === 'undefined') {
        return;
      }
      
      if (valueToStore === null) {
        // Remove from localStorage if null (cleanup)
        window.localStorage.removeItem(key);
      } else {
        // Save to localStorage
        window.localStorage.setItem(key, serializer(valueToStore));
      }
    } catch (error) {
      // Log any errors during storage operations
      onError(error);
    }
  }, [key, storedValue, serializer, onError]);
  
  // Listen for changes to this localStorage key from other tabs/windows
  useEffect(() => {
    if (!listenToStorageChanges || typeof window === 'undefined') {
      return;
    }
    
    // This handles the case where localStorage is updated in another tab/window
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserializer(e.newValue));
        } catch (error) {
          onError(error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Handle case where item was removed from localStorage
        setStoredValue(initialValue);
      }
    };
    
    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, deserializer, initialValue, listenToStorageChanges, onError]);
  
  return [storedValue, setValue];
}

// Default serializer/deserializer functions
function defaultSerializer<T>(value: StorageValue<T>): string {
  return JSON.stringify(value);
}

function defaultDeserializer<T>(value: string): StorageValue<T> {
  try {
    return JSON.parse(value);
  } catch {
    return value as unknown as StorageValue<T>;
  }
}

export default useLocalStorage;