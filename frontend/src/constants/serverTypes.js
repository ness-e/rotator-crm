/**
 * @file serverTypes.js
 * @description Archivo del sistema serverTypes.js.
 * @module Module
 * @path /frontend/src/constants/serverTypes.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// Server Types - Valores originales del sistema
export const SERVER_TYPES = [
    { value: '0', label: 'Nube de Rotator', type: 'cloud_rotator' },
    { value: '1', label: 'Servidor Privado', type: 'private' },
    { value: '2', label: 'Servidor Propio', type: 'own' },
]

export const SERVER_TYPE_MAP = Object.fromEntries(
    SERVER_TYPES.map(t => [t.value, t.label])
)

export const getServerTypeName = (value) => {
    return SERVER_TYPE_MAP[String(value)] || 'Desconocido'
}
