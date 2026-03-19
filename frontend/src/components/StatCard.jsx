/**
 * @file StatCard.jsx
 * @description Componente reutilizable de UI: StatCard.
 * @module Frontend Component
 * @path /frontend/src/components/StatCard.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({ title, value, icon: Icon, trend, trendLabel, className = '' }) {
    const getTrendIcon = () => {
        if (!trend) return null;
        const numTrend = parseFloat(trend);
        if (numTrend > 0) return <TrendingUp className="h-4 w-4 text-success" />;
        if (numTrend < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

    const getTrendColor = () => {
        if (!trend) return 'text-muted-foreground';
        const numTrend = parseFloat(trend);
        if (numTrend > 0) return 'text-success';
        if (numTrend < 0) return 'text-destructive';
        return 'text-muted-foreground';
    };

    return (
        <Card className={`card-professional hover:shadow-medium transition-shadow ${className}`}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                        {trend && (
                            <div className="flex items-center gap-1">
                                {getTrendIcon()}
                                <span className={`text-sm font-medium ${getTrendColor()}`}>
                                    {trend}
                                </span>
                                {trendLabel && (
                                    <span className="text-sm text-muted-foreground">{trendLabel}</span>
                                )}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className="rounded-lg bg-primary/10 p-3">
                            <Icon className="h-6 w-6 text-primary" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default StatCard;
