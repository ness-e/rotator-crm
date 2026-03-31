/**
 * @file validate.js
 * @description Public endpoint for desktop app license validation.
 *              Receives serialKey + hardwareId + pcName, validates the license,
 *              registers activation, and returns encryptedActivationKey.
 * @module Backend Route
 * @path /backend/src/routes/validate.js
 * @lastUpdated 2026-03-20
 */

import { Router } from 'express'
import { prisma } from '../config/prismaClient.js'
import { logAction } from '../services/audit.service.js'
import { generateEncryptedActivationKey } from '../services/licenseEncryption.js'
import { getLanguageFromCountry } from '../services/languageService.js'

const router = Router()

/**
 * Fuzzy match for organization name validation.
 * Normalizes and checks containment.
 */
function fuzzyMatch(name1, name2) {
    if (!name1 || !name2) return false
    const n1 = name1.toString().toUpperCase().replace(/[^A-Z0-9]/g, '')
    const n2 = name2.toString().toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (n1 === n2) return true
    if (n1.includes(n2) || n2.includes(n1)) return true
    return false
}

// POST /api/validate
// Desktop client sends: serialKey, hardwareId, pcName, organizationName
// Returns: encryptedActivationKey + limits + language
router.post('/', async (req, res) => {
    try {
        const { serialKey, hardwareId, pcName, organizationName, organizationData, countryCode } = req.body

        if (!serialKey) {
            return res.status(400).json({ valid: false, error: 'Serial Key is required' })
        }

        // 1. Find license with all relations
        const license = await prisma.license.findUnique({
            where: { serialKey },
            include: {
                organization: true,
                productTemplate: true,
                hostingPlan: true,
                serverNode: true
            }
        })

        if (!license) {
            return res.status(404).json({ valid: false, error: 'License not found' })
        }

        // 2. Check status
        if (license.status !== 'ACTIVE') {
            return res.status(403).json({ valid: false, error: `License is ${license.status}` })
        }

        // 3. Check expiration
        if (license.expirationDate && new Date(license.expirationDate) < new Date()) {
            return res.status(403).json({ valid: false, error: 'License expired' })
        }

        // 4. Fuzzy org name validation
        const orgNameToCheck = organizationName || organizationData?.name
        if (orgNameToCheck) {
            if (!fuzzyMatch(license.organization.name, orgNameToCheck)) {
                return res.status(403).json({ valid: false, error: 'Organization name mismatch' })
            }
        }

        // 5. Register activation with hardwareId
        const activationHwId = hardwareId || null
        const activationPcName = pcName || organizationData?.pcName || 'Unknown'

        if (activationHwId) {
            try {
                await prisma.activationLog.create({
                    data: {
                        licenseId: license.id,
                        pcName: activationPcName,
                        keyUsed: serialKey,
                        hardwareId: activationHwId,
                        ipAddress: req.ip
                    }
                })
            } catch (e) {
                // P2002 = duplicate activation → that's OK, just means already activated
                if (e.code !== 'P2002') throw e
            }

            // Update machineId on license if not already set
            if (!license.machineId) {
                await prisma.license.update({
                    where: { id: license.id },
                    data: { machineId: activationHwId }
                })
            }
        }

        // 6. Read system settings for key generation
        const majorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MAJOR' } })
        const minorSetting = await prisma.systemSetting.findUnique({ where: { key: 'SOFTWARE_VERSION_MINOR' } })
        const magicSetting = await prisma.systemSetting.findUnique({ where: { key: 'XOR_MAGIC_WORD' } })

        // 7. Generate encrypted activation key on-the-fly
        const encryptedActivationKey = generateEncryptedActivationKey({
            softwareVersionMajor: majorSetting?.value || '4',
            softwareVersionMinor: minorSetting?.value || '3',
            hardwareId: activationHwId || '0',
            versionId: license.productTemplate?.versionId ?? 0,
            expirationDate: license.expirationDate || new Date('3000-01-01'),
            hostingPlanId: license.hostingPlanId ?? 0,
            serverType: license.serverNodeId ?? 0,
            admins: license.limitAdmins,
            mobiles: license.limitMobileUsers,
            phones: license.limitPhoneUsers,
            dataEntries: license.limitDataEntries,
            analysts: license.limitAnalysts,
            classifiers: license.limitClassifiers,
            captureSups: license.limitCaptureSupervisors,
            kioskSups: license.limitKioskSupervisors,
            clients: license.limitClients,
            questions: license.limitQuestions,
        }, magicSetting?.value || 'yiyo')

        // 8. Derive language from country
        const language = getLanguageFromCountry(
            countryCode || license.organization.countryCode
        )

        // 9. Return full validation response
        return res.json({
            valid: true,
            licenseId: license.id,
            encryptedActivationKey,
            organization: license.organization.name,
            product: license.productTemplate?.name || 'Rotator Survey',
            language,
            limits: {
                questions: license.limitQuestions,
                cases: license.limitCases,
                admins: license.limitAdmins,
                mobileUsers: license.limitMobileUsers,
                phoneUsers: license.limitPhoneUsers,
                dataEntries: license.limitDataEntries,
                analysts: license.limitAnalysts,
                clients: license.limitClients,
                classifiers: license.limitClassifiers,
                captureSupervisors: license.limitCaptureSupervisors,
                kioskSupervisors: license.limitKioskSupervisors,
                participants: license.limitParticipants,
                concurrentQuestionnaires: license.concurrentQuestionnaires
            },
            hosting: {
                planId: license.hostingPlanId,
                planName: license.hostingPlan?.name || null,
                serverId: license.serverNodeId,
                serverType: license.serverNode?.type || null
            },
            expiration: license.expirationDate
        })

    } catch (e) {
        console.error('Validate error:', e)
        res.status(500).json({ valid: false, error: 'Internal Server Error' })
    }
})

export default router
