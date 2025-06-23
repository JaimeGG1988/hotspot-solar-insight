
import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

interface ErrorState {
  error: string | null;
  isError: boolean;
  errorTimestamp?: number;
}

export const useOptimizedErrorHandler = () => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false
  });

  const handleError = useCallback((error: unknown, customMessage?: string) => {
    console.error('Error handled:', error);
    
    let errorMessage = customMessage || 'Ha ocurrido un error inesperado';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    const newErrorState = {
      error: errorMessage,
      isError: true,
      errorTimestamp: Date.now()
    };

    setErrorState(newErrorState);
    toast.error(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false
    });
  }, []);

  const withErrorHandling = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      fn: T,
      customMessage?: string
    ): T => {
      return (async (...args: Parameters<T>) => {
        try {
          clearError();
          return await fn(...args);
        } catch (error) {
          handleError(error, customMessage);
          throw error;
        }
      }) as T;
    },
    [handleError, clearError]
  );

  // Memoized error state info
  const errorInfo = useMemo(() => ({
    hasError: errorState.isError,
    errorMessage: errorState.error,
    errorAge: errorState.errorTimestamp ? Date.now() - errorState.errorTimestamp : 0,
    isRecentError: errorState.errorTimestamp ? (Date.now() - errorState.errorTimestamp) < 5000 : false
  }), [errorState]);

  return {
    error: errorState.error,
    isError: errorState.isError,
    handleError,
    clearError,
    withErrorHandling,
    errorInfo
  };
};
