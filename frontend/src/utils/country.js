/**
 * @file country.js
 * @description Archivo del sistema country.js.
 * @module Module
 * @path /frontend/src/utils/country.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

export function countryName(code=''){
  const up = String(code||'').toUpperCase()
  try{
    const dn = new Intl.DisplayNames(['es'], { type: 'region' })
    const name = dn.of(up)
    return name || up || '-'
  }catch{
    const m = { VE:'Venezuela', AR:'Argentina', MX:'México', ES:'España', US:'Estados Unidos' }
    return m[up] || up || '-'
  }
}
