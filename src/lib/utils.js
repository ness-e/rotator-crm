/**
 * @file utils.js
 * @description Tailwind CSS class name utility for conditional styling
 * 
 * @overview
 * Provides the `cn` utility function for merging Tailwind CSS class names with
 * proper conflict resolution. Combines clsx for conditional classes and tailwind-merge
 * for deduplication.
 * 
 * @features
 * - Conditional class names
 * - Tailwind class conflict resolution
 * - Array and object syntax support
 * - Automatic deduplication
 * 
 * @usage
 * ```javascript
 * import { cn } from './lib/utils';
 * 
 * // Basic usage
 * <div className={cn('text-red-500', 'font-bold')} />
 * 
 * // Conditional classes
 * <div className={cn('base-class', isActive && 'active-class')} />
 * 
 * // Object syntax
 * <div className={cn({
 *   'text-red-500': isError,
 *   'text-green-500': isSuccess
 * })} />
 * 
 * // Tailwind conflict resolution
 * <div className={cn('p-4', 'p-8')} /> // Results in 'p-8' only
 * ```
 * 
 * @module utils.lib
 * @path /frontend/src/lib/utils.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
