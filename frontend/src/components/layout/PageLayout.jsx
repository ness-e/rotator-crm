/**
 * @file PageLayout.jsx
 * @description Componente reutilizable de UI: PageLayout.
 * @module Frontend Component
 * @path /frontend/src/components/layout/PageLayout.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/**
 * PageLayout - Componente estandarizado para layouts de páginas
 * 
 * Características:
 * - Título y subtítulo consistentes
 * - Tabs fuera del contenedor (debajo del título)
 * - Sin color de fondo en tabs
 * - Espaciado reducido entre título y contenido
 * - Soporte para acciones en el header
 * 
 * @param {string} title - Título de la página
 * @param {string} subtitle - Subtítulo opcional
 * @param {Array} tabs - Array de tabs [{value, label, icon}]
 * @param {string} defaultTab - Tab activo por defecto
 * @param {ReactNode} actions - Botones/acciones en el header
 * @param {ReactNode} children - Contenido de la página
 * @param {string} className - Clases adicionales
 */
export function PageLayout({
    title,
    subtitle,
    tabs = null,
    defaultTab = null,
    actions = null,
    children,
    className,
}) {
    const [searchParams, setSearchParams] = useSearchParams();

    // Si no hay tabs, renderizar layout simple
    if (!tabs || tabs.length === 0) {
        return (
            <div className={cn('space-y-4', className)}>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="page-title">{title}</h1>
                        {subtitle && <p className="page-subtitle">{subtitle}</p>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {children}
                </div>
            </div>
        );
    }

    // Determine the active tab: URL param > defaultTab > first tab
    // We use the 'tab' query parameter to persist state across reloads
    const activeTab = searchParams.get('tab') || defaultTab || tabs[0]?.value;

    const handleTabChange = (value) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('tab', value);
            return newParams;
        }, { replace: true });
    };

    // Layout con tabs
    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="page-title">{title}</h1>
                    {subtitle && <p className="page-subtitle">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Tabs - Fuera del contenedor, sin fondo */}
            <Tabs
                value={activeTab}
                onValueChange={handleTabChange}
                className="space-y-4"
            >
                <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0 space-x-4">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
                            >
                                {Icon && <Icon className="h-4 w-4 mr-2" />}
                                {tab.label}
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                {/* Content */}
                <div className="tab-content-container">
                    {typeof children === 'function' ? children() : children}
                </div>
            </Tabs>
        </div>
    );
}

/**
 * PageLayoutTab - Componente para contenido de cada tab
 * Wrapper simple para TabsContent con estilos consistentes
 */
export function PageLayoutTab({ value, children, className }) {
    return (
        <TabsContent value={value} className={cn('m-0 space-y-6', className)}>
            {children}
        </TabsContent>
    );
}
