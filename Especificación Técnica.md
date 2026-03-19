# **Ficha Técnica de Desarrollo: Sistema Rotator Survey 2.0 (SaaS & CRM)**

**Destinatario:** Equipo de Desarrollo (Antigravity / Dev Team)

**Versión:** 3.1 (Final \- Lógica de Activación Revisada)

**Fecha:** 27 de Enero, 2026

**Prioridad:** Alta \- Migración Crítica

## **1\. Resumen Ejecutivo del Proyecto**

El objetivo es la refactorización total del ecosistema de licenciamiento de "Rotator Survey". Se debe migrar de una arquitectura legacy descentralizada a una arquitectura **SaaS Centralizada B2B**.

**Principios Fundamentales:**

1. **Entidad Maestra \= Organización:** No existen "usuarios" sueltos. La cuenta es la Organización. Todas las licencias pertenecen a la Organización.  
2. **Validación Estricta de Identidad:** El software de escritorio no se valida solo por serial, sino verificando que la Organización y el País coincidan con el registro de compra.  
3. **Gestión de Infraestructura:** Capacidad de asignar organizaciones a servidores específicos (Nodos) o dominios personalizados.

## **2\. Estándares Tecnológicos (Stack Obligatorio)**

| Capa | Tecnología | Versión / Regla |
| :---- | :---- | :---- |
| **Backend** | Node.js v18+ | API REST en Monorepo (Express). |
| **Frontend** | React v18+ | Vite + TailwindCSS. **ShadCN UI** para componentes. |
| **ORM** | Prisma v5+ | schema.prisma como fuente de la verdad. |
| **DB** | SQLite | Base de datos principal (rotator.db). |
| **Entorno** | Windows/Linux | Compatible con despliegue en Windows (BAT scripts). |

## **3\. Arquitectura de Datos**

### **3.1. Organización (El Cliente)**

Es la entidad que se autentica y dueña de los activos.

* **Restricción:** La Organización funciona como el "Usuario Único" a efectos de gestión. No se requiere gestión compleja de multi-usuarios dentro de una misma organización para esta fase.  
* **Datos:** Nombre Fiscal, RIF/NIT, País (Crítico para validación), Dirección, Datos de Contacto.

### **3.2. Licencia (El Producto Técnico)**

La licencia define **qué puede hacer el software**. No contiene datos de facturación, solo límites técnicos y claves.

* **Datos de Identificación:**  
  * serialKey: String único de venta.  
  * legacyId: ID de referencia a la BD antigua.  
* **Límites del Plan (Constraints):**  
  * limitQuestions: Máximo de preguntas permitidas.  
  * limitCases: Máximo de casos (encuestados).  
  * limitConcurrentUsers: Cuántas personas pueden usar el software simultáneamente en esa licencia.  
  * expirationDate: Fecha de corte del servicio.

### **3.3. Activaciones (Historial de Instalaciones)**

Tabla ActivationLog.

* Función: Registro inmutable de *dónde* se instaló la licencia.  
* Datos: pcName, ipAddress, hardwareId (Clave Amarilla), fecha.

## **4\. Reglas de Negocio y Algoritmos (Backend Logic)**

### **4.1. Algoritmo de Validación de Licencia (Endpoint /api/validate)**

**Lógica Crítica:** El software de escritorio enviará un payload con datos ingresados por el humano \+ datos técnicos del PC. El backend debe validar la coherencia de los datos del negocio antes de registrar la activación técnica.

**Input Esperado:**

{ serialKey, organizationName, countryISO, hardwareId, pcName, localIp }

**Procedimiento de Validación:**

1. **Búsqueda:** Buscar License donde serialKey coincida.  
   * *Si no existe:* ERROR\_INVALID\_SERIAL.  
2. **Verificación de Identidad (Organización):**  
   * Obtener la Organization dueña de la licencia.  
   * **Validar Nombre:** Comparar Organization.name con input.organizationName (Normalizar strings, ignorar mayúsculas/acentos). Fuzzy match aceptable (80% similitud).  
   * **Validar País:** Comparar Organization.countryCode con input.countryISO.  
   * *Si no coinciden:* ERROR\_IDENTITY\_MISMATCH (El serial es válido, pero no pertenece a esa empresa/país).  
3. **Verificación de Estado:**  
   * Si License.status \!= ACTIVE o expirationDate \< NOW \-\> ERROR\_EXPIRED.  
4. **Registro de Activación (El "Commit"):**  
   * Si los pasos 1, 2 y 3 son **EXITOSOS**:  
   * **INSERTAR** en tabla ActivationLog: Guardar hardwareId (Clave Amarilla), pcName, ip y fecha.  
   * *Nota:* El hardwareId se guarda *después* de validar, como constancia de uso.  
5. **Respuesta Exitosa:**  
   * Retornar HTTP 200 OK.  
   * Body: { status: "ACTIVATED", limits: { questions, cases, users }, serverNode: "IP\_DEL\_SERVIDOR\_ASIGNADO" }.

### **4.2. Migración y Auditoría**

* **Scripts de Migración:** Mapear maestro\_clientes \-\> Organization. Todos los campos de contacto del usuario legacy pasan a ser campos de la Organización.  
* **Auditoría:** Cada cambio en un límite de licencia (limitCases de 100 \-\> 1000\) debe generar un registro en AuditLog indicando qué operador del sistema realizó el cambio.

## **5\. Módulos Funcionales y UI Requerida**

### **A. Dashboard Administrativo (Backoffice)**

1. **Gestor de Organizaciones:**  
   * CRUD completo.  
   * Buscador rápido (Cmd+K) por nombre, serial de licencia o correo.  
   * Vista de "Infraestructura": Asignar organización a un ServerNode (Lista desplegable de servidores disponibles).  
2. **Gestor de Licencias:**  
   * Edición de Límites: Sliders o inputs numéricos para ajustar Preguntas/Casos en tiempo real.  
   * Botón "Revocar": Cambia status a REVOKED (impide futuras validaciones).  
   * **Botón "Clonar":** Copiar la configuración de una licencia existente para crear una nueva rápidamente.

### **B. Módulo CRM (Ventas & Prospectos)**

1. **Pipeline Kanban:**  
   * Columnas: Prospecto \-\> Contactado \-\> Demo \-\> Negociación \-\> Cerrado.  
   * Drag & Drop para mover tarjetas.  
2. **Ficha de Prospecto:**  
   * Datos de contacto.  
   * Historial de FollowUps (Bitácora de llamadas/emails).  
   * Botón **"Convertir a Organización"**: Transfiere los datos del prospecto a la tabla Organization y genera una licencia trial automáticamente.

### **C. Analítica y Reportes**

1. **Mapa de Calor:** Distribución de clientes por País.  
2. **Reporte de Vencimientos:** Tabla de licencias próximas a vencer (30, 60, 90 días) para gestión proactiva de renovaciones.  
3. **Auditoría:** Tabla de logs donde se vea *quién* modificó *qué* y *cuándo*.

## **6\. Integraciones y Notificaciones**

### **6.1. Servicio de Correo (SMTP)**

El sistema debe usar Nodemailer configurado con las siguientes variables de entorno (proveídas en .env):

* **Host:** smtp.gmail.com  
* **Port:** 587  
* **Auth:** Credenciales de eros.messy@gmail.com (App Password).

**Plantillas Requeridas (HTML):**

1. **Bienvenida/Compra:** Envío del Serial, instrucciones de descarga y Factura.  
2. **Alerta de Vencimiento:** Trigger automático 7 días antes de expirar.  
3. **Recuperación de Acceso:** Link seguro para resetear password de la Organización.

### **6.2. PayPal (Webhooks)**

* Escuchar evento PAYMENT.SALE.COMPLETED.  
* Acción: Buscar Organización por email \-\> Si existe, agregar nueva licencia. Si no, crear Organización \+ Licencia basada en el plan\_id pagado.

## **7\. Entregables Esperados**

1. **Código Fuente:** Repositorio Monorepo (Frontend \+ Backend).  
2. **Base de Datos:** Scripts SQL/Prisma para levantar la estructura en MySQL limpio y script de migración (seed.ts) para la data legacy.  
3. **Documentación API:** Swagger/OpenAPI en /api-docs para que el desarrollador del software de escritorio sepa cómo consumir el endpoint /validate.