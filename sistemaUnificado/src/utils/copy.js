/**
 * @file copy.js
 * @description Clipboard utility for copying text with toast notifications
 * 
 * @overview
 * Provides a simple wrapper around the Clipboard API with automatic toast
 * notifications for success and error states.
 * 
 * @features
 * - Copy text to clipboard
 * - Optional toast notifications
 * - Error handling
 * 
 * @usage
 * ```javascript
 * import { copyToClipboard } from './utils/copy.js';
 * import { toast } from './components/ui/use-toast';
 * 
 * // With toast
 * await copyToClipboard('ABC-123-XYZ', toast);
 * 
 * // Without toast
 * const success = await copyToClipboard('ABC-123-XYZ');
 * if (success) console.log('Copied!');
 * ```
 * 
 * @module copy.utils
 * @path /frontend/src/utils/copy.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

export async function copyToClipboard(text, toast) {
  try {
    await navigator.clipboard.writeText(text || '')
    if (toast) toast({ title: 'Copiado' })
    return true
  } catch (e) {
    if (toast) toast({ title: 'Error', description: 'No se pudo copiar', variant: 'destructive' })
    return false
  }
}
