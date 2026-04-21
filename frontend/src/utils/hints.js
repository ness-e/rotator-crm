/**
 * @file hints.js
 * @description Diccionario centralizado de textos de ayuda y tooltips para todo el sistema.
 */

export const SYSTEM_HINTS = {
    // CRM & Clientes
    ORG_CLASSIFICATION: "Permite categorizar a la organización según su importancia o sector (VIP, Gubernamental, Académico, etc).",
    ORG_COUNTRY: "País base de la organización para cálculos de zona horaria y moneda regional.",
    ORG_TAX_ID: "Identificación fiscal oficial de la empresa (RUT, NIT, RIF, etc).",
    USER_ROLE: "Define el nivel de acceso del usuario: MASTER (total), ANALISTA (gestión), VISUALIZADOR (solo lectura).",
    CLIENT_STATUS: "Estado actual del cliente en el ciclo de vida del CRM.",
    CLIENT_SCORE: "Calificación automática basada en el historial de pagos y renovaciones.",
    
    // Infraestructura
    SERVER_TYPE: "Clasificación técnica del servidor según su rol: Base de Datos, Aplicación, Almacenamiento o Balanceador.",
    SERVER_STATUS: "Indica si el servidor está operativo, en mantenimiento o fuera de línea.",
    SERVER_IP: "Dirección IPv4 o IPv6 pública del servidor para conectividad remota.",
    SERVER_PRIMARY_DOMAIN: "Dominio principal asociado a este servidor para la resolución de servicios.",
    DOMAIN_EXPIRY: "Fecha en la que el dominio debe ser renovado con el registrador para evitar pérdida de servicio.",
    
    // Licencias
    LICENSE_EXPIRY: "Fecha exacta en la que el software dejará de ser funcional para el cliente si no se renueva.",
    LICENSE_USERS: "Cantidad máxima de puestos o usuarios concurrentes permitidos por esta licencia.",
    LICENSE_XOR_KEY: "Clave técnica utilizada para la validación de integridad de la licencia en el software desktop.",
    LICENSE_VERSION: "Versión específica del producto que el cliente tiene derecho a utilizar.",

    // Integraciones
    PAYPAL_CLIENT_ID: "Identificador único de su aplicación en el portal de desarrolladores de PayPal.",
    SMTP_HOST: "Servidor de correo saliente (ej: smtp.gmail.com o mail.empresa.com).",
    SMTP_PORT: "Puerto de conexión segura (comúnmente 465 para SSL o 587 para TLS).",
    
    // Configuración General
    MAINTENANCE_MODE: "Si se activa, el sistema solo será accesible para administradores MASTER. Los usuarios verán una pantalla de mantenimiento.",
    SESSION_TIMEOUT: "Tiempo de inactividad permitido (en segundos) antes de cerrar la sesión automáticamente por seguridad.",
    PASSWORD_POLICY: "Nivel de complejidad requerido para contraseñas: LOW (mín 6 car), MEDIUM (mín 8 car + número), HIGH (mín 10 car + número + símbolo).",
    REPORT_EMAILS: "Direcciones de correo que recibirán alertas críticas, reportes diarios y notificaciones de sistema.",
    DEFAULT_CURRENCY: "Moneda base para todos los cálculos financieros, reportes y facturación del sistema.",
    APP_NAME: "Nombre comercial de la aplicación. Se utiliza en el título de la pestaña y en el cuerpo de los correos automáticos.",
    SITE_NAME: "Nombre del portal o sitio web orientado al cliente.",
    SOFTWARE_VERSION_MAJOR: "Versión mayor del software desktop. Cambios significativos de arquitectura.",
    SOFTWARE_VERSION_MINOR: "Versión menor del software desktop. Correcciones y mejoras menores.",
    XOR_MAGIC_WORD: "Palabra secreta utilizada para el cifrado XOR de las licencias generadas.",

    // Plantillas de Email
    EMAIL_TEMPLATE_NAME: "Nombre interno para identificar esta plantilla en el sistema. No visible para el destinatario.",
    EMAIL_TEMPLATE_SUBJECT: "El asunto que verá el destinatario en su bandeja de entrada. Soporta variables dinámicas {{variable}}.",
    EMAIL_TEMPLATE_BODY: "Código HTML de la plantilla. Las variables {{variable}} se reemplazan con datos reales al momento del envío.",
    EMAIL_TEMPLATE_VARIABLES: "Variables dinámicas disponibles para esta plantilla. Se reemplazan con datos reales al enviar.",
};
