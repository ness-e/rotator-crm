/**
 * @file PageLoader.jsx
 * @description Componente reutilizable de UI: PageLoader.
 * @module Frontend Component
 * @path /frontend/src/components/PageLoader.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * PageLoader - Loading fallback para lazy loaded pages
 * Muestra skeletons mientras se carga la página
 */
export function PageLoader() {
    return (
        <div className="space-y-6 p-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-4 border-b pb-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Content skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
}

/**
 * ComponentLoader - Loading fallback para componentes lazy loaded
 * Versión más pequeña para componentes individuales
 */
export function ComponentLoader() {
    return (
        <div className="space-y-4 p-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-48 w-full" />
        </div>
    );
}

export default PageLoader;
