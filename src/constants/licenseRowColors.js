/**
 * @file licenseRowColors.js
 * @description Archivo del sistema licenseRowColors.js.
 * @module Module
 * @path /frontend/src/constants/licenseRowColors.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

export const LICENSE_ROW_COLORS = {
  EN: '#558B2F', // Enterprise (Old/Legacy?)
  IN: '#F1F8E9', // Individual
  FT: '#42A5F5', // Flex Teams (Was FX)
  ET: '#1565C0', // Enterprises (Was EE)
  ST: '#E0E0E0', // Starter (Light Gray)
  AC: '#A9F5E1', // Academia
  EV: '#FFEB3B', // Evaluacion
  PR: '#906AF9', // Profesional
  UN: '#0D47A1', // Unlimit
  PF: '#FBC02D', // Profesor
  DO: '#FFF9C4', // Donación
  TP: '#8BC34A', // Team Premier
  TB: '#C5E1A5', // Team Basic
}

export function colorForLicenseType(type) {
  if (!type) return 'transparent'
  const key = String(type).trim().toUpperCase()
  const color = LICENSE_ROW_COLORS[key]
  if (!color) return 'transparent'
  return color || 'transparent'
}
