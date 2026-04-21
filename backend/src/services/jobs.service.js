/**
 * @file jobs.service.js
 * @description Scheduled background jobs for automated system tasks
 * 
 * @overview
 * This service manages scheduled background jobs that run automatically to perform
 * maintenance tasks. Currently implements license expiration checking that runs daily
 * to notify users about expiring or expired licenses.
 * 
 * @features
 * - Daily license expiration checks
 * - Multi-threshold notifications (30, 7, 3, 1, 0, -1 days)
 * - Email and in-app notifications
 * - Organization-wide notifications
 * - Automatic job initialization on server start
 * 
 * @jobs
 * 1. **checkLicenseExpirations** - Runs every 24 hours
 *    - Checks all active licenses with expiration dates
 *    - Sends notifications at key thresholds (30, 7, 3, 1, 0, -1 days)
 *    - Notifies all users in the license's organization
 *    - Sends both email and in-app notifications
 * 
 * @notification-thresholds
 * - 30 days before: "Your license expires in 30 days"
 * - 7 days before: "Your license expires in 7 days"
 * - 3 days before: "Your license expires in 3 days"
 * - 1 day before: "Your license expires tomorrow"
 * - Expiration day: "Your license expires TODAY"
 * - 1 day after: "Your license has expired"
 * 
 * @usage
 * ```javascript
 * import { initJobs, checkLicenseExpirations } from './jobs.service.js';
 * 
 * // Initialize all scheduled jobs (called in server startup)
 * initJobs();
 * 
 * // Manually trigger license check
 * await checkLicenseExpirations();
 * ```
 * 
 * @schedule
 * - Initial run: 10 seconds after server start
 * - Recurring: Every 24 hours (86400000 ms)
 * 
 * @dependencies
 * - @prisma/client - Database access
 * - notification.service.js - For in-app notifications
 * - email.service.js - For email notifications (sendLicenseExpiryWarning)
 * - audit.service.js - For logging job executions
 * 
 * @future-enhancements
 * - Add more scheduled jobs (data cleanup, report generation, etc.)
 * - Implement job queue system (Bull, BullMQ)
 * - Add job monitoring and error reporting
 * - Make schedules configurable via environment variables
 * - Add job execution history tracking
 * 
 * @related-files
 * - backend/src/index.js - Calls initJobs() on server start
 * - backend/src/services/email.service.js - Sends expiry emails
 * - backend/src/services/notification.service.js - Creates notifications
 * 
 * @module jobs.service
 * @path /backend/src/services/jobs.service.js
 * @lastUpdated 2026-01-29
 * @author Sistema
 */

import { prisma } from '../config/prismaClient.js'
import { createNotification } from './notification.service.js'
import { sendLicenseExpiryWarning, sendServerDiagnosticReport } from './email.service.js' 
import { logAction } from './audit.service.js'
import { runServerDiagnostics, getDiagnosticErrors } from './servers.service.js'

// Run every 6 hours
export const checkServerHealth = async () => {
    console.log('Running Server Health Diagnostics Check...')
    try {
        const servers = await prisma.serverNode.findMany({
            where: { status: 'active' }
        })

        // Get admin email from settings or default
        const adminSetting = await prisma.systemSetting.findFirst({ where: { key: 'admin_email' } })
        const adminEmail = adminSetting?.value || process.env.SMTP_USER || 'admin@rotatorsurvey.com'

        for (const server of servers) {
            if (!server.primaryDomain) continue

            let errors = []
            try {
                const diagData = await runServerDiagnostics(server.id)
                errors = getDiagnosticErrors(diagData)
            } catch (err) {
                console.error(`Failed to run health check for server ${server.name}:`, err.message)
                errors.push(`Fallo de Conexión: No se pudo contactar al servidor para el diagnóstico. Error: ${err.message}`)
            }

            if (errors.length > 0) {
                console.warn(`[HEALTH ALERT] Server ${server.name} has ${errors.length} errors`)
                
                // Send Email to Admin
                await sendServerDiagnosticReport(adminEmail, server.name, errors).catch(e => console.error('Failed to send diagnostic email:', e))

                // Optional: Create in-app notification for all masters/admins
                const masters = await prisma.user.findMany({
                    where: { role: 'MASTER' }
                })
                for (const master of masters) {
                    await createNotification(master.id, 'error', `Alerta de Salud: ${server.name}`, 
                        `Se detectaron ${errors.length} problemas en el servidor.`, { serverId: server.id }).catch(() => {})
                }

                // Log the failure
                await logAction(null, 'SERVER_HEALTH_FAILURE', 'serverNode', server.id, {
                    serverName: server.name,
                    errors
                }).catch(() => {})
            }
        }
    } catch (error) {
        console.error('Error in checkServerHealth:', error)
    }
}

// Run daily
export const checkLicenseExpirations = async () => {
    console.log('Running License Expirations Check...')
    try {
        // Find active licenses that have an expiration date
        const licenses = await prisma.license.findMany({
            where: {
                status: 'ACTIVE',
                expirationDate: { not: null }
            },
            include: {
                organization: {
                    include: {
                        users: true
                    }
                }
            }
        })

        const now = new Date()

        for (const license of licenses) {
            if (!license.expirationDate) continue

            const expDate = new Date(license.expirationDate)
            const diffTime = expDate - now
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            // Check thresholds: 30, 7, 3, 1, 0, -1
            let msgType = null
            if (diffDays === 30) msgType = 'in_30_days'
            if (diffDays === 7) msgType = 'in_7_days'
            if (diffDays === 3) msgType = 'in_3_days'
            if (diffDays === 1) msgType = 'tomorrow'
            if (diffDays === 0) msgType = 'today'
            if (diffDays === -1) msgType = 'expired'

            if (msgType) {
                let title = 'Aviso de Vencimiento'
                let message = ''
                let type = 'warning'

                const dateStr = license.expirationDate.toISOString().split('T')[0]

                if (diffDays > 0) message = `Su licencia expira en ${diffDays} días (${dateStr}).`
                else if (diffDays === 0) { message = 'Su licencia expira HOY.'; type = 'error' }
                else { title = 'Licencia Vencida'; message = 'Su licencia ha expirado.'; type = 'error' }

                // Notify all users in organization
                if (license.organization && license.organization.users) {
                    for (const user of license.organization.users) {
                        // In-app Notification
                        await createNotification(user.id, type, title, message, { 
                            licenseId: license.id, 
                            serial: license.serialKey, 
                            daysLeft: diffDays 
                        })

                        // Email
                        if (user.email && user.email.includes('@')) {
                            try {
                                await sendLicenseExpiryWarning(user, license, diffDays)
                            } catch (e) {
                                console.error('Failed to send expiry email', e)
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error in checkLicenseExpirations:', error)
    }
}

export const initJobs = () => {
    // Run once on start with a slight delay 
    setTimeout(checkLicenseExpirations, 10000)
    setTimeout(checkServerHealth, 30000) // Delay health check a bit more

    // Schedule recurring
    setInterval(checkLicenseExpirations, 86400000) // 24 hours
    setInterval(checkServerHealth, 6 * 60 * 60 * 1000) // 6 hours

    console.log('✅ Scheduled Jobs Initialized (License & Health)')
}
