/**
 * @file EmptyState.jsx
 * @description Empty state component for tables and lists
 * 
 * @overview
 * Displays a friendly empty state when no data is available,
 * with optional action button.
 */

import { FileQuestion } from 'lucide-react';
import { Button } from './ui/button';

export function EmptyState({
    title = 'No hay datos',
    description = 'No se encontraron registros',
    action = null,
    actionLabel = 'Crear nuevo',
    icon: Icon = FileQuestion
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Icon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {description}
            </p>
            {action && (
                <Button onClick={action}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
