/**
 * @file hostingTypes.js
 * @description Archivo del sistema hostingTypes.js.
 * @module Module
 * @path /frontend/src/constants/hostingTypes.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// Hosting Plan Types - Valores originales del sistema
export const HOSTING_TYPES = [
    { value: '0', label: 'Por Defecto' },
    { value: '1', label: 'Plan Bronze' },
    { value: '2', label: 'Plan Silver' },
    { value: '3', label: 'Plan Gold' },
    { value: '4', label: 'Plan Platinum' },
    { value: '99', label: 'Privado' },
    { value: '100', label: 'Propio' },
]

export const HOSTING_TYPE_MAP = Object.fromEntries(
    HOSTING_TYPES.map(t => [t.value, t.label])
)

export const getHostingTypeName = (value) => {
    return HOSTING_TYPE_MAP[String(value)] || 'Desconocido'
}
