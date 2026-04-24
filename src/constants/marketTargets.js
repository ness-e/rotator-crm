/**
 * @file marketTargets.js
 * @description Archivo del sistema marketTargets.js.
 * @module Module
 * @path /frontend/src/constants/marketTargets.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// Market Target Categories - Categorías de mercado objetivo
export const MARKET_TARGETS = [
    { value: 'IM', label: 'Investigación de Mercado', abbr: 'IM' },
    { value: 'CO', label: 'Consultora', abbr: 'CO' },
    { value: 'PN', label: 'Persona Natural', abbr: 'PN' },
    { value: 'ONG', label: 'ONG', abbr: 'ONG' },
    { value: 'CORP', label: 'Corporación', abbr: 'CORP' },
    { value: 'FU', label: 'Fundación', abbr: 'FU' },
    { value: 'UN', label: 'Universidad', abbr: 'UN' },
]

export const MARKET_TARGET_MAP = Object.fromEntries(
    MARKET_TARGETS.map(t => [t.value, t.label])
)

export const getMarketTargetName = (value) => {
    return MARKET_TARGET_MAP[String(value)] || 'Desconocido'
}
