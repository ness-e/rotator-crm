/**
 * License Serial Generation Service
 * 
 * Replicates the legacy serial format:
 * PAIS-TIPO-HOSTING-DDMMAAAA-CORREO(3)-ORG(2)-ACTIVADOR(2)
 * 
 * Example: VE-EN-PRI-15023000-ROG-RE-AB
 */

/**
 * Generate a license serial key following the legacy format.
 * 
 * @param {Object} params
 * @param {string} params.countryCode      - ISO 2-letter country code (e.g. "VE", "MX")
 * @param {string} params.versionAbbr      - Product version abbreviation (e.g. "EN", "TB", "IN")
 * @param {string} params.hostingAbbr      - Hosting plan abbreviation (e.g. "SIL", "GOL", "PRI")
 * @param {Date|string} params.expirationDate - License expiration date
 * @param {string} params.email            - Client email address
 * @param {string} params.orgName          - Organization name
 * @param {string} params.activatorName    - Full name of the MASTER user performing the action
 * @returns {string} Serial key in format PAIS-TIPO-HOSTING-DDMMAAAA-COR-OR-ACT
 */
export function generateSerial({ countryCode, versionAbbr, hostingAbbr, expirationDate, email, orgName, activatorFirstName, activatorLastName, activatorEmail }) {
    // Country code — 2 letters uppercase
    const country = (countryCode || 'XX').toUpperCase().substring(0, 2);

    // Version abbreviation — 2 letters
    const version = (versionAbbr || 'ST').toUpperCase().substring(0, 2);

    // Hosting abbreviation — 3 letters
    const hosting = (hostingAbbr || 'DEF').toUpperCase().substring(0, 3);

    // Expiration date — DDMMYYYY
    const expDate = new Date(expirationDate);
    const dd = String(expDate.getDate()).padStart(2, '0');
    const mm = String(expDate.getMonth() + 1).padStart(2, '0');
    const yyyy = String(expDate.getFullYear());
    const dateStr = `${dd}${mm}${yyyy}`;

    // Email code — first 2 chars of local part + first char after @
    const emailParts = (email || 'xxx@x.com').split('@');
    const localPart = emailParts[0] || 'XX';
    const domainPart = emailParts[1] || 'X';
    const emailCode = (
        localPart.substring(0, 2) + domainPart.substring(0, 1)
    ).toUpperCase();

    // Organization code — first char + last char
    const cleanOrg = (orgName || 'XX').replace(/\s+/g, '');
    const orgCode = (
        cleanOrg.charAt(0) + cleanOrg.charAt(cleanOrg.length - 1)
    ).toUpperCase();

    // Activator code — initials from first name and last name
    const activatorCode = getActivatorCode(activatorFirstName, activatorLastName, activatorEmail);

    return `${country}-${version}-${hosting}-${dateStr}-${emailCode}-${orgCode}-${activatorCode}`;
}

/**
 * Extract a 2-letter activator code from a first name and last name.
 * Takes the first letter of first name + first letter of last name.
 * Falls back to first 2 chars if no space found or fallback email.
 * 
 * @param {string} firstName 
 * @param {string} lastName 
 * @param {string} fallbackEmail 
 * @returns {string} 2-letter code
 */
export function getActivatorCode(firstName, lastName, fallbackEmail) {
    let fInitial = firstName ? firstName.trim().charAt(0) : '';
    let lInitial = lastName ? lastName.trim().charAt(0) : '';

    if (fInitial && lInitial) {
        return (fInitial + lInitial).toUpperCase();
    }
    
    // Fallback if missing one of them
    const combined = (firstName || '') + (lastName || '');
    if (combined.trim().length >= 2) {
        return combined.trim().substring(0, 2).toUpperCase();
    }

    if (fallbackEmail && fallbackEmail.length >= 2) {
        return fallbackEmail.substring(0, 2).toUpperCase();
    }

    return 'XX';
}
