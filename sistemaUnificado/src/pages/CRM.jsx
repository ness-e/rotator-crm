import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminClients from './AdminClients';
import AdminProspects from './AdminProspects';

/**
 * @file CRM.jsx
 * @description Hub principal CRM — despacha Clientes Activos o Pipeline según el query param 'tab'
 */
export default function CRM() {
    const [searchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'active';

    return (
        <div className="container-fluid p-0 animate-in fade-in duration-500">
            {activeTab === 'active' ? (
                <AdminClients />
            ) : (
                <AdminProspects />
            )}
        </div>
    );
}
