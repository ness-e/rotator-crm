/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} String con la primera letra en mayúscula
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String con cada palabra capitalizada
 */
export function capitalizeWords(str) {
    if (!str) return '';
    return str
        .split(' ')
        .map(word => capitalize(word))
        .join(' ');
}

/**
 * Formatea un path de ruta a título legible
 * @param {string} path - Path de la ruta (ej: '/admin/gestion')
 * @returns {string} Título formateado
 */
export function pathToTitle(path) {
    if (!path) return '';
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return capitalizeWords(lastSegment.replace(/-/g, ' '));
}
