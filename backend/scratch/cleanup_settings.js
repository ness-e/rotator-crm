import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up duplicate settings...');
    const settings = await prisma.systemSetting.findMany();
    
    for (const s of settings) {
        if (s.key !== s.key.toUpperCase()) {
            console.log(`Deleting lowercase/mixed key: ${s.key}`);
            await prisma.systemSetting.delete({ where: { key: s.key } });
        }
        
        // Remove OpenAI if found (just in case)
        if (s.key.includes('OPENAI') || s.key.includes('GPT')) {
            console.log(`Deleting OpenAI related key: ${s.key}`);
            await prisma.systemSetting.delete({ where: { key: s.key } });
        }
    }
    
    console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
