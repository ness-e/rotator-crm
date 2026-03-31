/**
 * @file CRM.jsx
 * @description Hub principal CRM & Clientes — fusiona gestión de clientes con pipeline y analytics.
 * @module Frontend Page
 * @path /frontend/src/pages/CRM.jsx
 * @lastUpdated 2026-03-24
 */

import React from 'react';
import { Network, Briefcase } from 'lucide-react';
import AdminClients from './AdminClients';
import AdminProspects from './AdminProspects';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';

export default function CRM() {
    return (
        <PageLayout
            title="CRM & Clientes"
            subtitle="Gestiona clientes, prospectos, pipeline y seguimientos."
            tabs={[
                { value: 'active', label: 'Clientes Activos', icon: Briefcase },
                { value: 'pipeline', label: 'Pipeline', icon: Network }
            ]}
            defaultTab="active"
        >
            <PageLayoutTab value="active">
                <AdminClients />
            </PageLayoutTab>

            <PageLayoutTab value="pipeline">
                <AdminProspects />
            </PageLayoutTab>
        </PageLayout>
    );
}
