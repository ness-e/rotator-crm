import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const licenses = await prisma.license.findMany({
      include: {
        organization: true,
        activations: true,
        hostingPlan: true,
        serverNode: true,
        productTemplate: true,
        activatedBy: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    })
    console.log("SUCCESS! Found:", licenses.length)
  } catch (err) {
    console.error("PRISMA ERROR:")
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
