/**
 * @file StatusBadge.jsx
 * @description Componente reutilizable de UI: StatusBadge.
 * @module Frontend Component
 * @path /frontend/src/components/StatusBadge.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
    active: {
        label: 'Activa',
        className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
        icon: CheckCircle2,
    },
    expired: {
        label: 'Expirada',
        className: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
        icon: XCircle,
    },
    pending: {
        label: 'Pendiente',
        className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
        icon: Clock,
    },
    expiring: {
        label: 'Por Vencer',
        className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
        icon: AlertCircle,
    },
    inactive: {
        label: 'Inactiva',
        className: 'bg-muted text-muted-foreground border-border hover:bg-muted/80',
        icon: XCircle,
    },
};

export function StatusBadge({ status, label, showIcon = true, className = '' }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.inactive;
    const Icon = config.icon;
    const displayLabel = label || config.label;

    return (
        <Badge className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 ${config.className} ${className}`}>
            {showIcon && <Icon className="h-3 w-3" />}
            <span className="text-xs font-medium">{displayLabel}</span>
        </Badge>
    );
}

export default StatusBadge;
