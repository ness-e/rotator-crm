import i18n from 'i18next';

/**
 * @file hints.js
 * @description Diccionario centralizado de textos de ayuda y tooltips para todo el sistema.
 * Refactorizado para usar i18next dinámicamente mediante un Proxy.
 */

export const SYSTEM_HINTS = new Proxy({}, {
    get: (target, key) => {
        // Si el i18n no está listo o el texto no existe, retornará la clave
        // pero i18next suele manejar los defaults si se configura así.
        return i18n.t(`hints.${key}`);
    }
});
