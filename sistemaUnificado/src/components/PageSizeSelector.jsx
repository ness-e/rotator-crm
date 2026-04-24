import React from 'react';

export function PageSizeSelector({ pageSize, onPageSizeChange }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Mostrar:</span>
            <select
                value={String(pageSize)}
                onChange={e => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-w-[120px] shadow-sm"
            >
                <option value="50">50 registros</option>
                <option value="100">100 registros</option>
                <option value="all">Todos los registros</option>
            </select>
        </div>
    );
}

export default PageSizeSelector;
