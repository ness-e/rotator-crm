/**
 * @file renewalStatus.js
 * @description Archivo del sistema renewalStatus.js.
 * @module Module
 * @path /frontend/src/constants/renewalStatus.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// Renewal Status - Estados de renovación de licencias
export const RENEWAL_STATUS = [
    { value: 'RENOVO', label: 'Renovado', color: 'bg-emerald-500' },
    { value: 'NO_RENOVO', label: 'No Renovado', color: 'bg-rose-500' },
    { value: 'PENDIENTE', label: 'Pendiente', color: 'bg-amber-500' },
    { value: 'INTERMITENTE', label: 'Intermitente', color: 'bg-orange-500' },
    { value: 'NUEVO', label: 'Nuevo', color: 'bg-blue-500' },
]

export const RENEWAL_STATUS_MAP = Object.fromEntries(
    RENEWAL_STATUS.map(s => [s.value, s])
)

export const getRenewalStatusLabel = (value) => {
    return RENEWAL_STATUS_MAP[value]?.label || 'Desconocido'
}

export const getRenewalStatusColor = (value) => {
    return RENEWAL_STATUS_MAP[value]?.color || 'bg-slate-200'
}
