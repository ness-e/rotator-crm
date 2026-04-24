/**
 * @file debounce.js
 * @description React hook for debouncing values to optimize performance
 * 
 * @overview
 * Provides a custom React hook that debounces value changes, useful for
 * search inputs, API calls, and other scenarios where you want to delay
 * reactions to rapid changes.
 * 
 * @features
 * - Debounce any value
 * - Configurable delay
 * - Automatic cleanup
 * 
 * @usage
 * ```javascript
 * import { useDebouncedValue } from './utils/debounce.js';
 * 
 * function SearchComponent() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebouncedValue(search, 500);
 *   
 *   useEffect(() => {
 *     // Only runs 500ms after user stops typing
 *     if (debouncedSearch) {
 *       fetchResults(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 *   
 *   return <input value={search} onChange={e => setSearch(e.target.value)} />;
 * }
 * ```
 * 
 * @module debounce.utils
 * @path /frontend/src/utils/debounce.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import React from 'react'

export function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}
