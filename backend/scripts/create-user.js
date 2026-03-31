import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function test() {
    const hash = await bcrypt.hash('123456', 10);
    const user = await prisma.user.create({
        data: {
            email: 'eros.messy@gmail.com',
            password: hash,
            firstName: 'Eros',
            lastName: 'Messy',
            role: 'MASTER'
        }
    });
    console.log('Successfully created user with password 123456');
    await prisma.$disconnect();
}

test().catch(console.error);
