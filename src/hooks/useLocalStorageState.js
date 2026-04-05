import { useEffect, useState } from 'react';

/**
 * Persist small pieces of client state without coupling components to
 * window.localStorage directly.
 *
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {[T, import('react').Dispatch<import('react').SetStateAction<T>>]}
 */
export function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore persistence failures and keep the UI usable.
    }
  }, [key, value]);

  return [value, setValue];
}
