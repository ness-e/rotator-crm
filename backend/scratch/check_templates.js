import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.emailTemplate.findMany();
    console.log('Templates found:', templates.length);
    templates.forEach(t => console.log(`- ${t.code}: ${t.name}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
