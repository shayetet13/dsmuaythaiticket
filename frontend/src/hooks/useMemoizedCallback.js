import { useCallback, useRef } from 'react';

/**
 * Memoized callback hook with dependency tracking
 * Prevents unnecessary re-renders
 * @param {Function} callback - Callback function
 * @param {Array} dependencies - Dependency array
 * @returns {Function} Memoized callback
 */
export const useMemoizedCallback = (callback, dependencies) => {
  const callbackRef = useRef(callback);
  
  // Update ref when callback changes
  callbackRef.current = callback;
  
  return useCallback(
    (...args) => callbackRef.current(...args),
    dependencies
  );
};

