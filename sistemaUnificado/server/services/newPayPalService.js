/**
 * @file newPayPalService.js
 * @description Archivo del sistema newPayPalService.js.
 * @module Module
 * @path /backend/src/services/newPayPalService.js
 * @lastUpdated 2026-01-27
 * @author Sistema (Auto-Generated)
 */

import { prisma } from '../config/prismaClient.js'
import { MagicLinkService } from './MagicLinkService.js'

export const PayPalService = {
    async handleWebhook(event) {
        const eventType = event.event_type

        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = event.resource
            const payerEmail = resource.payer?.email_address
            const payerName = `${resource.payer?.name?.given_name} ${resource.payer?.name?.surname}`
            const amount = resource.amount?.value
            const orderId = resource.id
            // Custom ID often holds product info or user ID
            const customId = resource.custom_id

            console.log(`💰 PayPal Payment: ${amount} from ${payerEmail}`)

            // Check if user exists
            const user = await prisma.user.findUnique({ where: { email: payerEmail } })

            if (user) {
                // User exists, create license directly
                console.log('👤 User exists. Creating license...')

                const serial = `PAYPAL-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

                await prisma.license.create({
                    data: {
                        serialKey: serial,
                        organizationId: user.organizationId, // Assoc to user's org
                        status: 'ACTIVE',
                        hostingType: 'CLOUD_ROTATOR',
                        limitQuestions: 100,
                        limitCases: 1000,
                        limitAdmins: 1,
                        purchaseDate: new Date(),
                        // Log payment info?
                        paypalSubId: orderId
                    }
                })

                // Notify user about new license?
                // emailService.send(...)

            } else {
                // User does not exist, send Magic Link
                console.log('✨ User new. Sending Magic Link...')

                await MagicLinkService.createIntentAndSendLink({
                    email: payerEmail,
                    name: payerName,
                    productCode: 'ROTATOR_PRO_AUTO', // Infer from amount or customId
                    paypalOrderId: orderId,
                    amount: Number(amount)
                })
            }
        }
    }
}
