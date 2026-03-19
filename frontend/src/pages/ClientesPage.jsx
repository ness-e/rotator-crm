/**
 * @file ClientesPage.jsx
 * @description Componente de página (Vista) para la sección ClientesPage.
 * @module Frontend Page
 * @path /frontend/src/pages/ClientesPage.jsx
 * @lastUpdated 2026-03-12
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { FilePlus, Activity, Clock } from 'lucide-react';
import NewClient from './NewClient';
import AdminClients from './AdminClients';
import PendingClients from './PendingClients';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';

export default function ClientesPage() {
    return (
        <PageLayout
            title="Clientes"
            subtitle="Gestiona clientes nuevos, prospectos y clientes activos."
            tabs={[
                { value: 'new', label: 'Nuevo Cliente', icon: FilePlus },
                { value: 'active', label: 'Clientes Activos', icon: Activity },
                { value: 'pending', label: 'Pendientes', icon: Clock }
            ]}
            defaultTab="new"
        >
            <PageLayoutTab value="new">
                <NewClient />
            </PageLayoutTab>

            <PageLayoutTab value="active">
                <AdminClients />
            </PageLayoutTab>

            <PageLayoutTab value="pending">
                <PendingClients />
            </PageLayoutTab>
        </PageLayout>
    );
}
