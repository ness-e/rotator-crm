/**
 * @file licenseTypes.js
 * @description Archivo del sistema licenseTypes.js.
 * @module Module
 * @path /frontend/src/constants/licenseTypes.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

// License Types - Valores originales del sistema
export const LICENSE_TYPES = [
  { value: '0', label: 'Starter Edition', abbr: 'ST' },
  { value: '1', label: 'Evaluation Edition', abbr: 'EV' },
  { value: '2', label: 'Academia Edition', abbr: 'AC' },
  { value: '3', label: 'Professional Edition', abbr: 'PR' },
  { value: '4', label: 'Enterprise Edition', abbr: 'EN' },
  { value: '5', label: 'Unlimited Edition', abbr: 'UN' },
  { value: '6', label: 'Professor Edition', abbr: 'PF' },
  { value: '7', label: 'Donation Edition', abbr: 'DO' },
  { value: '8', label: 'Individuals', abbr: 'IN' },
  { value: '9', label: 'Flex Teams', abbr: 'FT' },
  { value: '10', label: 'Enterprises', abbr: 'ET' },
  { value: '11', label: 'Team Basic', abbr: 'TB' },
  { value: '12', label: 'Team Premier', abbr: 'TP' },
]

// Map for quick lookup by value
export const LICENSE_TYPE_MAP = Object.fromEntries(
  LICENSE_TYPES.map(t => [t.value, t.label])
)

// Get label from value
export const getLicenseTypeName = (value) => {
  return LICENSE_TYPE_MAP[String(value)] || 'Desconocido'
}
