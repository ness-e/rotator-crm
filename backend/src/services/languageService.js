/**
 * Language Service
 * 
 * Replicates the legacy PHP function dameIdiomaSegunPaisDe2Letras().
 * Derives language from a 2-letter ISO country code.
 */

// Spanish-speaking countries
const SPANISH_COUNTRIES = new Set([
    'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV',
    'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'ES', 'UY', 'VE'
]);

// Portuguese-speaking countries
const PORTUGUESE_COUNTRIES = new Set([
    'AO', 'BR', 'CV', 'MZ', 'PT'
]);

/**
 * Get the UI language code based on a 2-letter ISO country code.
 * 
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g. "VE", "BR", "US")
 * @returns {'es' | 'pt' | 'en'} Language code
 */
export function getLanguageFromCountry(countryCode) {
    const code = (countryCode || '').toUpperCase().trim();

    if (SPANISH_COUNTRIES.has(code)) return 'es';
    if (PORTUGUESE_COUNTRIES.has(code)) return 'pt';
    return 'en';
}

/**
 * Get the full language name for display.
 * 
 * @param {string} langCode - 'es', 'pt', or 'en'
 * @returns {string} Full language name
 */
export function getLanguageName(langCode) {
    const names = {
        es: 'Español',
        pt: 'Português',
        en: 'English'
    };
    return names[langCode] || 'English';
}
