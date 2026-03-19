/**
 * @file DataTable.jsx
 * @description Componente reutilizable de UI: DataTable.
 * @module Frontend Component
 * @path /frontend/src/components/DataTable.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react';
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
    rowKey = 'id'
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
                    <table className="table-professional">
                        <thead>
                            <tr>
                                {selectable && (
                                    <th className="w-[50px] text-center">
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
                                        className={column.sortable !== false && sortable ? 'cursor-pointer select-none hover:bg-muted/70 transition-colors' : ''}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span>{column.label}</span>
                                            {column.sortable !== false && getSortIcon(column.key)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length + (selectable ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                                        No hay datos para mostrar
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, index) => {
                                    const id = row[rowKey] || index;
                                    return (
                                        <tr key={id} className={selectedRows.has(id) ? 'bg-muted/50' : ''}>
                                            {selectable && (
                                                <td className="text-center">
                                                    <Checkbox
                                                        checked={selectedRows.has(id)}
                                                        onCheckedChange={() => toggleRow(id)}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((column) => (
                                                <td key={column.key}>
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

            {sortedData.length > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                    <span>Selected: {selectedRows.size} of {sortedData.length}</span>
                </div>
            )}
        </div>
    );
}

export default DataTable;
