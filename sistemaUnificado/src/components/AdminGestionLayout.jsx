/**
 * @file AdminGestionLayout.jsx
 * @description Contenedor global estandarizado para las pantallas de gestión administrativa.
 * @module Frontend Component
 * @path /frontend/src/components/AdminGestionLayout.jsx
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageSizeSelector } from './PageSizeSelector';
import { useTranslation } from 'react-i18next';

export function AdminGestionLayout({
    icon: Icon,
    title,
    description,
    actions,
    filterTitle,
    searchPlaceholder,
    searchValue = '',
    onSearchChange,
    pageSize = 10,
    onPageSizeChange,
    currentPage = 1,
    totalPages = 1,
    totalItems = 0,
    onPageChange,
    children 
}) {
    const { t } = useTranslation();
    
    const filterTitleToUse = filterTitle ?? t('common.filters');
    const searchPlaceholderToUse = searchPlaceholder ?? t('common.searchPlaceholder');

    return (
        <div className="space-y-6 animate-fade-in w-full overflow-x-hidden">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-50">
                        {Icon && <Icon className="h-8 w-8 text-primary" />}
                        {title}
                    </h1>
                    {description && (
                        <p className="text-muted-foreground mt-1 text-lg">
                            {description}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex gap-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Main Content Card Wrapper */}
            <Card className="border-none shadow-xl dark:bg-slate-900/50 bg-white">
                <CardContent className="p-6 space-y-6">
                    {/* Unified Search & Filters Toolbar */}
                    {(onSearchChange || onPageSizeChange) && (
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {filterTitleToUse}
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {onSearchChange && (
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={searchPlaceholderToUse}
                                            value={searchValue}
                                            onChange={e => onSearchChange(e.target.value)}
                                            className="pl-9 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 rounded-lg border-slate-200 dark:border-slate-800 shadow-sm"
                                        />
                                    </div>
                                )}
                                {onPageSizeChange && (
                                    <PageSizeSelector pageSize={pageSize} onPageSizeChange={onPageSizeChange} />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Children - Typically the DataTable */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                        {children}
                    </div>

                    {/* Pagination */}
                    {onPageChange && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-full">
                                {t('common.results_count', { count: totalItems })} {totalPages > 1 && `— ${t('common.page')} ${currentPage} ${t('common.of')} ${totalPages}`}
                            </p>
                            
                            {totalPages > 1 && (
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
                                        disabled={currentPage <= 1}
                                        className="rounded-lg px-4"
                                    >
                                        {t('common.previous')}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
                                        disabled={currentPage >= totalPages}
                                        className="rounded-lg px-4"
                                    >
                                        {t('common.next')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default AdminGestionLayout;
