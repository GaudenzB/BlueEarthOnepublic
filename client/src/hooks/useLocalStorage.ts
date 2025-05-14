import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * 
 * This hook provides a state variable that persists in localStorage across page reloads.
 * It's fully type-safe and handles serialization/deserialization of complex types.
 * 
 * @template T - Type of the stored value
 * @param key - localStorage key
 * @param initialValue - Initial value or function that returns initial value
 * @returns [storedValue, setValue, removeValue] - Tuple containing the current value, 
 *          a function to update it, and a function to remove it
 * 
 * @example
 * ```tsx
 * // Simple usage
 * const [theme, setTheme, removeTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');
 * 
 * // Usage with an object
 * const [user, setUser, removeUser] = useLocalStorage<{name: string; id: number} | null>(
 *   'user',
 *   null
 * );
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = useCallback((): T => {
    // Browser environment check
    if (typeof window === 'undefined') {
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : (
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return typeof initialValue === 'function'
        ? (initialValue as () => T)()
        : initialValue;
    }
  }, [initialValue, key]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      // Remove from local storage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }

      // Reset state to initial value
      setStoredValue(
        typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue
      );
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [initialValue, key]);

  // Listen for changes to this localStorage key from other windows/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key) return;

      try {
        // If key was removed
        if (e.newValue === null) {
          setStoredValue(
            typeof initialValue === 'function'
              ? (initialValue as () => T)()
              : initialValue
          );
          return;
        }

        // If key was updated
        const newValue = JSON.parse(e.newValue) as T;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(`Error parsing localStorage change for key "${key}":`, error);
      }
    };

    // This only works for other documents/tabs, not the current one
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;