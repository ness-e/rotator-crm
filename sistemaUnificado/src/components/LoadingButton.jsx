/**
 * @file LoadingButton.jsx
 * @description Button component with loading state and spinner
 * 
 * @overview
 * Enhanced button component that shows a loading spinner and disables
 * interaction while an async operation is in progress.
 */

import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

export function LoadingButton({
    children,
    isLoading = false,
    disabled = false,
    className = '',
    ...props
}) {
    return (
        <Button
            disabled={isLoading || disabled}
            className={className}
            {...props}
        >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </Button>
    );
}
