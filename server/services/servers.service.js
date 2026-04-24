/**
 * @file servers.service.js
 * @description Service for server-related operations, including diagnostics and health checks
 */

import { prisma } from '../config/prismaClient.js';

// Global monitor token
const MONITOR_SECRET_TOKEN = process.env.MONITOR_SECRET_TOKEN || 'ROTATOR_MONITOR_2026_CHANGE_ME';

/**
 * Runs diagnostics on a specific server by calling its remote monitor script
 * @param {number} serverId 
 * @returns {Promise<Object>}
 */
export const runServerDiagnostics = async (serverId) => {
    const server = await prisma.serverNode.findUnique({ where: { id: serverId } });
    if (!server) throw new Error('Server not found');
    if (!server.primaryDomain) {
        throw new Error('Server has no primaryDomain configured');
    }

    // Build the monitor URL
    const domain = server.primaryDomain.replace(/\/+$/, '');
    const monitorUrl = `https://${domain}/tests/monitorServer.php?token=${encodeURIComponent(MONITOR_SECRET_TOKEN)}&t=${Date.now()}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const response = await fetch(monitorUrl, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeout);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Monitor script responded with HTTP ${response.status}: ${text.substring(0, 100)}`);
        }

        return await response.json();
    } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr.name === 'AbortError') {
            throw new Error('Diagnostics request timed out after 30 seconds');
        }
        throw fetchErr;
    }
};

/**
 * Checks if a diagnostic result contains any critical failures
 * @param {Object} data Diagnostic JSON from monitorServer.php
 * @returns {Array<string>} List of error messages
 */
export const getDiagnosticErrors = (data) => {
    const errors = [];
    
    // Check main tests
    if (data.tests) {
        data.tests.forEach(test => {
            if (test.status === 'error') {
                errors.push(`${test.name}: ${test.message}`);
            }
        });
    }

    // Check specific system requirements
    if (data.system && data.system.disk_usage) {
        const disk = data.system.disk_usage;
        if (disk.percent > 95) {
            errors.push(`Disk Usage: ${disk.percent}% is critically high`);
        }
    }

    return errors;
};

export default {
    runServerDiagnostics,
    getDiagnosticErrors
};
