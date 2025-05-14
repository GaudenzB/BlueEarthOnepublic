import { useState, useCallback } from 'react';

/**
 * Interface for form state with loading, success, and error states
 */
export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  setLoading: () => void;
  setSuccess: () => void;
  setError: (error: Error) => void;
  reset: () => void;
}

/**
 * Hook for managing form submission states
 * 
 * This hook provides state management for forms, handling loading, success, and error states.
 * It's useful for providing user feedback during form submission processes.
 * 
 * @returns FormState object containing states and setters
 * 
 * @example
 * ```tsx
 * const { isLoading, isSuccess, isError, error, setLoading, setSuccess, setError, reset } = useFormState();
 * 
 * const handleSubmit = async (data) => {
 *   try {
 *     setLoading();
 *     await submitForm(data);
 *     setSuccess();
 *     // Show success message or redirect
 *   } catch (err) {
 *     setError(err);
 *     // Show error message
 *   }
 * };
 * 
 * return (
 *   <form onSubmit={handleSubmit}>
 *     {isLoading && <Spinner />}
 *     {isSuccess && <SuccessMessage />}
 *     {isError && <ErrorMessage error={error} />}
 *     <button type="submit" disabled={isLoading}>Submit</button>
 *   </form>
 * );
 * ```
 */
export function useFormState(): FormState {
  // States for form submission
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setErrorMessage] = useState<Error | null>(null);
  
  // Set loading state
  const setLoading = useCallback(() => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage(null);
  }, []);
  
  // Set success state
  const setSuccess = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(true);
    setIsError(false);
    setErrorMessage(null);
  }, []);
  
  // Set error state
  const setError = useCallback((err: Error) => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(true);
    setErrorMessage(err);
  }, []);
  
  // Reset all states
  const reset = useCallback(() => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage(null);
  }, []);
  
  return {
    isLoading,
    isSuccess,
    isError,
    error,
    setLoading,
    setSuccess,
    setError,
    reset
  };
}

export default useFormState;