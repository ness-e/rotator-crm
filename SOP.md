# Standard Operating Procedure (SOP) - Rotator User System

This document defines the unified operating logic for the system modules to ensure consistency and prevent functional duplication.

## 1. User Roles & Access Logic

| Role | Scope | Primary Responsibility |
| :--- | :--- | :--- |
| **MASTER (SUPER_ADMIN)** | Global | Infrastructure, Organizations, Master CRM, Global Settings. |
| **ORGANIZATION ADMIN** | Organization | User management within Org, License assignment, Local CRM. |
| **MEMBER** | Personal | Task execution, data entry (subject to permissions). |

---

## 2. Module Logic & Procedures

### 2.1 Organizations (Master Only)
- **Logic**: The root of the system. Every client belongs to an Organization.
- **Procedure**:
  1. Create Organization (TaxID, Country, Name).
  2. The Organization acts as a billing and user container.

### 2.2 CRM (Unified)
- **Tabs**:
  - **Pipeline/Prospects**: Manage potential sales.
  - **Clients (360)**: View converted clients with their infrastructure.
  - **Infrastructure**: Manage Servers and Domains attached to clients.
  - **Analytics**: Global sales and performance metrics.
- **Flow**: Prospect -> Negotiation -> Won -> Conversion to Organization/Client.

### 2.3 Gestión (Unified Management)
- **Logic**: Centralized hub for system objects.
- **Tabs**:
  - **Users**: Create/Delete system users.
  - **Licenses**: Manage serial keys, limits (questions, cases), and status.
  - **Activations**: Monitor real-time software activations (PC Name, IP).
  - **Audit**: Log of all sensitive operations.

### 2.4 Configuration
- **Logic**: Global settings for the platform.
- **Items**:
  - Constants (Market targets, server types).
  - UI Themes.
  - Backup & Security settings.

---

## 3. Maintenance Protocols

### 3.1 Avoiding Duplication
- **Rule**: Do not create standalone pages for features already present as Tabs in **CRM**, **Gestión**, or **Clientes**.
- **Redirection**: Any legacy URL (e.g., `/admin/users`) must redirect to its tabbed parent (e.g., `/admin/gestion?tab=users`).

### 3.2 Error Handling
- Modules must show "Incomplete" or "Planned" if features rely on external APIs not yet integrated (e.g., Geographic Maps).
