/**
 * Utilidades para exportar datos a CSV
 */

/**
 * Convierte un array de objetos a formato CSV
 * @param {Array} data - Array de objetos
 * @param {Array} columns - Columnas a incluir (opcional)
 * @returns {string} - Contenido CSV
 */
export function arrayToCSV(data, columns = null) {
    if (!data || data.length === 0) {
        return '';
    }

    // Si no se especifican columnas, usar todas las claves del primer objeto
    const headers = columns || Object.keys(data[0]);

    // Crear fila de encabezados
    const headerRow = headers.map(escapeCSVValue).join(',');

    // Crear filas de datos
    const dataRows = data.map(row => {
        return headers.map(header => {
            const value = row[header];
            return escapeCSVValue(value);
        }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapa un valor para CSV
 */
function escapeCSVValue(value) {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // Si contiene coma, comillas o salto de línea, envolver en comillas
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Exporta usuarios a CSV
 */
export function exportUsersToCSV(users) {
    const columns = [
        'id_cliente',
        'nombre_cliente',
        'apellido_cliente',
        'correo_cliente',
        'organizacion_cliente',
        'pais_cliente',
        'ciudad_cliente',
        'tipo_usuario',
        'fecha_registro',
    ];

    return arrayToCSV(users, columns);
}

/**
 * Exporta licencias a CSV
 */
export function exportLicensesToCSV(licenses) {
    const columns = [
        'id_licencia',
        'id_cliente',
        'serial_admin',
        'clave_encriptada',
        'licencia_tipo',
        'fecha_vence',
        'fecha_creacion',
    ];

    return arrayToCSV(licenses, columns);
}

/**
 * Exporta activaciones a CSV
 */
export function exportActivationsToCSV(activations) {
    const columns = [
        'id_activacion',
        'id_licencia',
        'nombre_computadora',
        'fecha_activacion',
        'ultima_conexion',
    ];

    return arrayToCSV(activations, columns);
}

/**
 * Descarga CSV en el navegador (función helper para frontend)
 */
export function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export default {
    arrayToCSV,
    exportUsersToCSV,
    exportLicensesToCSV,
    exportActivationsToCSV,
    downloadCSV,
};
