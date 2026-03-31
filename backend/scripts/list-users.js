import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
    const users = await prisma.user.findMany({ select: { email: true } });
    console.log('--- ALL USERS ---');
    console.log(users.map(u => u.email).join('\n'));
    await prisma.$disconnect();
}
test().catch(console.error);
