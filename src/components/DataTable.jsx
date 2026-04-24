/**
 * @file DataTable.jsx
 * @description Componente reutilizable de UI: DataTable con soporte para carga y estados vacíos.
 * @module Frontend Component
 * @path /frontend/src/components/DataTable.jsx
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export function DataTable({
    columns = [],
    data = [],
    sortable = true,
    exportable = false,
    onExport,
    selectable = false,
    onSelectionChange,
    className = '',
    rowKey = 'id',
    loading = false,
    emptyState = null
}) {
    const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });
    const [selectedRows, setSelectedRows] = React.useState(new Set());

    // Notify parent of selection changes
    React.useEffect(() => {
        if (selectable && onSelectionChange) {
            onSelectionChange(Array.from(selectedRows));
        }
    }, [selectedRows, selectable, onSelectionChange]);

    const handleSort = (key) => {
        if (!sortable) return;

        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;

            const comparison = aVal < bVal ? -1 : 1;
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [data, sortConfig]);

    const getSortIcon = (columnKey) => {
        if (!sortable) return null;
        if (sortConfig.key !== columnKey) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-primary" />
        ) : (
            <ChevronDown className="h-4 w-4 text-primary" />
        );
    };

    const toggleAll = (checked) => {
        if (checked) {
            const allIds = new Set(data.map((row, index) => row[rowKey] || index));
            setSelectedRows(allIds);
        } else {
            setSelectedRows(new Set());
        }
    };

    const toggleRow = (id) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {exportable && onExport && (
                <div className="flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            )}

            <div className="rounded-xl border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table-professional w-full">
                        <thead>
                            <tr>
                                {selectable && (
                                    <th className="w-[50px] text-center px-4 py-3">
                                        <Checkbox
                                            checked={sortedData.length > 0 && selectedRows.size === sortedData.length}
                                            onCheckedChange={toggleAll}
                                        />
                                    </th>
                                )}
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        onClick={() => column.sortable !== false && handleSort(column.key)}
                                        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${column.className || ''} ${column.sortable !== false && sortable ? 'cursor-pointer select-none hover:bg-muted/70 transition-colors' : ''}`}
                                    >
                                        <div className={`flex items-center gap-2 ${column.key === 'actions' ? 'justify-end' : ''}`}>
                                            <span>{column.label}</span>
                                            {column.sortable !== false && getSortIcon(column.key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-sm text-muted-foreground font-medium">Cargando datos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-12">
                                        {emptyState ? emptyState : (
                                            <div className="text-muted-foreground text-sm">No hay datos para mostrar</div>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, index) => {
                                    const id = row[rowKey] || index;
                                    return (
                                        <tr key={id} className={`hover:bg-muted/30 transition-colors ${selectedRows.has(id) ? 'bg-muted/50' : ''}`}>
                                            {selectable && (
                                                <td className="text-center px-4 py-3">
                                                    <Checkbox
                                                        checked={selectedRows.has(id)}
                                                        onCheckedChange={() => toggleRow(id)}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((column) => (
                                                <td key={column.key} className={`px-4 py-3 whitespace-nowrap ${column.className || ''}`}>
                                                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectable && sortedData.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                    <span>Seleccionados: {selectedRows.size} de {sortedData.length}</span>
                </div>
            )}
        </div>
    );
}

export default DataTable;
