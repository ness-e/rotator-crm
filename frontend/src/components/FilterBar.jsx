/**
 * @file FilterBar.jsx
 * @description Componente reutilizable de UI: FilterBar.
 * @module Frontend Component
 * @path /frontend/src/components/FilterBar.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

export function FilterBar({
    searchValue = '',
    onSearchChange,
    filters = [],
    onFilterChange,
    onClearFilters,
    className = ''
}) {
    const hasActiveFilters = searchValue || filters.some(f => f.value);

    return (
        <div className={`flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border ${className}`}>
            {/* Search Input */}
            {onSearchChange && (
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Buscar..."
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 focus-ring"
                    />
                </div>
            )}

            {/* Filter Selects */}
            {filters.map((filter, index) => (
                <div key={index} className="min-w-[150px]">
                    {filter.type === 'select' && (
                        <select
                            value={filter.value || ''}
                            onChange={(e) => onFilterChange(filter.name, e.target.value)}
                            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                            <option value="">{filter.placeholder || 'Todos'}</option>
                            {filter.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            ))}

            {/* Clear Filters Button */}
            {hasActiveFilters && onClearFilters && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearFilters}
                    className="gap-2"
                >
                    <X className="h-4 w-4" />
                    Limpiar
                </Button>
            )}

            {/* Filter Icon */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                {hasActiveFilters && <span className="font-medium">Filtros activos</span>}
            </div>
        </div>
    );
}

export default FilterBar;
