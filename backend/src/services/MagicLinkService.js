/**
 * @file MagicLinkService.js
 * @description Archivo del sistema MagicLinkService.js.
 * @module Module
 * @path /backend/src/services/MagicLinkService.js
 * @lastUpdated 2026-03-12
 * @author Sistema
 */

import { prisma } from '../config/prismaClient.js'
import crypto from 'crypto'
import { sendEmail } from './email.service.js'
import bcrypt from 'bcryptjs'
import { createNotification } from './notification.service.js'
import templates from './emailTemplates.js'

export const MagicLinkService = {
    /**
     * Generates a magic link token and creates a PurchaseIntent.
     */
    async createIntentAndSendLink({ email, name, productCode, paypalOrderId, paypalSubId, amount }) {
        const token = crypto.randomBytes(32).toString('hex')

        // Create Intent
        await prisma.purchaseIntent.create({
            data: {
                token,
                payerEmail: email,
                payerName: name,
                productCode,
                paypalOrderId,
                paypalSubId,
                amountPaid: amount,
                status: 'PENDING'
            }
        })

        // Send Email using standardized templates
        const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/activation/magic?token=${token}`
        const html = templates.magicLink(name, link)
        
        await sendEmail(email, 'Activa tu Licencia Rotator Survey', html)

        return token
    },

    /**
     * Redeems a token to create User, Org, and License.
     */
    async redeemToken(token, { password, fullName }) {
        const intent = await prisma.purchaseIntent.findUnique({ where: { token } })

        if (!intent) throw new Error('Token inválido')
        if (intent.status !== 'PENDING') throw new Error('Este enlace ya fue utilizado o expiró')

        // Transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Organization
            const orgName = intent.payerName ? `${intent.payerName} (Org)` : `Org de ${intent.payerEmail}`

            const org = await tx.organization.create({
                data: {
                    name: orgName,
                    clientType: 'C',
                    source: 'PAYPAL_AUTO'
                }
            })

            // 2. Create User
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            const user = await tx.user.create({
                data: {
                    email: intent.payerEmail,
                    password: hashedPassword,
                    fullName: fullName || intent.payerName || 'Usuario',
                    organizationId: org.id,
                    role: 'ADMIN', // First user is Admin
                    isActive: true
                }
            })

            // 3. Create License
            const serial = `PAYPAL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

            const license = await tx.license.create({
                data: {
                    serialKey: serial,
                    organizationId: org.id,
                    status: 'ACTIVE',
                    paypalSubId: intent.paypalSubId,
                    limitQuestions: 100,
                    limitCases: 1000,
                    limitAdmins: 1,
                    hostingType: 'CLOUD_ROTATOR'
                }
            })

            // 4. Update Intent
            await tx.purchaseIntent.update({
                where: { token },
                data: { status: 'COMPLETED' }
            })

            // 5. Create welcome notification
            await createNotification(user.id, {
                title: '¡Bienvenido!',
                message: 'Tu cuenta ha sido activada correctamente junto con tu nueva licencia.',
                type: 'SYSTEM'
            })

            return { user, org, license }
        })

        return result
    }
}
