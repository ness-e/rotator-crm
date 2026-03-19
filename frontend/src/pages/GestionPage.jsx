/**
 * @file GestionPage.jsx
 * @description Componente de página (Vista) para la sección GestionPage.
 * @module Frontend Page
 * @path /frontend/src/pages/GestionPage.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { Users, Activity, ShieldCheck, KeySquare } from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminLicenses from './AdminLicenses';
import AdminActivations from './AdminActivations';
import AdminAudit from './AdminAudit';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';

export default function GestionPage() {
    return (
        <PageLayout
            title="Gestión"
            subtitle="Administra usuarios, licencias y monitorea activaciones del sistema."
            tabs={[
                { value: 'users', label: 'Usuarios', icon: Users },
                { value: 'licenses', label: 'Licencias', icon: KeySquare },
                { value: 'activations', label: 'Monitor Activaciones', icon: Activity },
                { value: 'audit', label: 'Auditoría', icon: ShieldCheck }
            ]}
            defaultTab="users"
        >
            <PageLayoutTab value="users">
                <AdminUsers />
            </PageLayoutTab>

            <PageLayoutTab value="licenses">
                <AdminLicenses />
            </PageLayoutTab>

            <PageLayoutTab value="activations">
                <AdminActivations />
            </PageLayoutTab>

            <PageLayoutTab value="audit">
                <AdminAudit />
            </PageLayoutTab>
        </PageLayout>
    );
}
