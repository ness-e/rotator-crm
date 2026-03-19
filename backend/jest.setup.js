import { jest, beforeAll } from '@jest/globals'
import dotenv from 'dotenv'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

// Cargar variables de entorno de test si existe el archivo
if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test' })
}

const prisma = new PrismaClient()

// Timeout global para tests
jest.setTimeout(10000)

// Configuración global antes de todos los tests
beforeAll(async () => {
  // Asegurar que los roles básicos existen (necesarios para FK de User)
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Super admin', permissions: '*', isSystem: true },
    { name: 'ADMIN', description: 'Admin', permissions: 'read,write', isSystem: true },
    { name: 'MEMBER', description: 'Member', permissions: 'read', isSystem: true },
    { name: 'BILLING', description: 'Billing', permissions: 'billing', isSystem: true }
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role
    })
  }

  await prisma.$disconnect()
})
