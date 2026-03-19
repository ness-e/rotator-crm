import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const email = 'admin@rotatorsurvey.com';
  console.log(`Checking accounts for email: ${email}`);
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true }
  });
  
  if (user) {
    console.log('USER found:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- IsActive: ${user.isActive}`);
    console.log(`- HasPassword: ${!!user.password}`);
    console.log(`- Org: ${user.organization?.name}`);
  } else {
    console.log('USER NOT FOUND');
  }
  
  const org = await prisma.organization.findUnique({
    where: { email }
  });
  
  if (org) {
    console.log('ORGANIZATION found:');
    console.log(`- ID: ${org.id}`);
    console.log(`- IsMaster: ${org.isMaster}`);
    console.log(`- IsActive: ${org.isActive}`);
    console.log(`- HasPassword: ${!!org.password}`);
  } else {
    console.log('ORGANIZATION NOT FOUND');
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
