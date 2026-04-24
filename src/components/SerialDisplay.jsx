/**
 * @file SerialDisplay.jsx
 * @description Componente reutilizable de UI: SerialDisplay.
 * @module Frontend Component
 * @path /frontend/src/components/SerialDisplay.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export function SerialDisplay({ serial, label, className = '' }) {
    const [copied, setCopied] = React.useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(serial);
            setCopied(true);
            toast({
                title: 'Copiado',
                description: 'Serial copiado al portapapeles',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo copiar el serial',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {label && <span className="text-sm text-muted-foreground">{label}:</span>}
            <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border group hover:border-primary/50 transition-colors">
                <code className="font-mono text-sm font-medium">{serial}</code>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                >
                    {copied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                        <Copy className="h-3.5 w-3.5" />
                    )}
                </Button>
            </div>
        </div>
    );
}

export default SerialDisplay;
