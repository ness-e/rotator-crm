/**
 * @file CRM.jsx
 * @description Componente de página (Vista) para la sección CRM.
 * @module Frontend Page
 * @path /frontend/src/pages/CRM.jsx
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import React from 'react';
import { TrendingUp, Server, Users, Calendar, DollarSign, Network, Database, Briefcase } from 'lucide-react';
import AdminCRMDashboard from './AdminCRMDashboard';
import ClientList from './CRM/ClientList'; // Unified List
import AdminServersAndDomains from './AdminServersAndDomains';
import AdminMigrationClients from './AdminMigrationClients';
import GeographicMetrics from './GeographicMetrics';
import AdminProspects from './AdminProspects';
import HostingCosts from './HostingCosts';
import FollowUpCalendar from '../components/FollowUpCalendar';
import { PageLayout, PageLayoutTab } from '@/components/layout/PageLayout';

export default function CRM() {
    return (
        <PageLayout
            title="CRM"
            subtitle="Gestiona clientes, prospectos, pipeline y seguimientos."
            tabs={[
                { value: 'clients', label: 'Clientes (360)', icon: Briefcase },
                { value: 'analytics', label: 'Analytics', icon: TrendingUp },
                { value: 'pipeline', label: 'Pipeline', icon: Network },
                { value: 'infrastructure', label: 'Infraestructura', icon: Server },
                { value: 'costs', label: 'Costos', icon: DollarSign },
                { value: 'migrations', label: 'Migraciones', icon: Users },
                { value: 'calendar', label: 'Calendario', icon: Calendar },
                { value: 'geographic', label: 'Geográfico', icon: Database }
            ]}
            defaultTab="clients"
        >
            <PageLayoutTab value="clients">
                <ClientList />
            </PageLayoutTab>

            <PageLayoutTab value="analytics">
                <AdminCRMDashboard />
            </PageLayoutTab>

            <PageLayoutTab value="pipeline">
                <AdminProspects />
            </PageLayoutTab>

            <PageLayoutTab value="infrastructure">
                <AdminServersAndDomains />
            </PageLayoutTab>

            <PageLayoutTab value="costs">
                <HostingCosts />
            </PageLayoutTab>

            <PageLayoutTab value="migrations">
                <AdminMigrationClients />
            </PageLayoutTab>

            <PageLayoutTab value="calendar">
                <FollowUpCalendar />
            </PageLayoutTab>

            <PageLayoutTab value="geographic">
                <GeographicMetrics />
            </PageLayoutTab>
        </PageLayout>
    );
}
