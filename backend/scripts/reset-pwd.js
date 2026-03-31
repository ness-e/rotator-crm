import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
    const hash = await bcrypt.hash('123456', 10);
    await prisma.user.update({
        where: { email: 'eros.messy@gmail.com' },
        data: { password: hash }
    });
    console.log('Successfully set password to 123456');
    await prisma.$disconnect();
}

test().catch(console.error);
