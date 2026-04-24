import { prisma } from './server/config/prismaClient.js';

async function test() {
  console.log('--- Testing Catalog Models ---');
  try {
    console.log('Checking prisma.activador...');
    if (prisma.activador) {
      const count = await prisma.activador.count();
      console.log('Activadores count:', count);
    } else {
      console.log('❌ prisma.activador is UNDEFINED in Prisma Client');
    }
  } catch (e) {
    console.log('❌ Error checking activador:', e.message);
  }

  try {
    console.log('Checking prisma.hosting...');
    if (prisma.hosting) {
      const count = await prisma.hosting.count();
      console.log('Hosting count:', count);
    } else {
      console.log('❌ prisma.hosting is UNDEFINED in Prisma Client');
    }
  } catch (e) {
    console.log('❌ Error checking hosting:', e.message);
  }

  try {
    console.log('Checking prisma.licenseVersion...');
    if (prisma.licenseVersion) {
      const count = await prisma.licenseVersion.count();
      console.log('LicenseVersion count:', count);
    } else {
      console.log('❌ prisma.licenseVersion is UNDEFINED in Prisma Client');
    }
  } catch (e) {
    console.log('❌ Error checking licenseVersion:', e.message);
  }

  try {
    console.log('Checking prisma.productTemplate (the correct one)...');
    const count = await prisma.productTemplate.count();
    console.log('✅ ProductTemplates count:', count);
  } catch (e) {
    console.log('❌ Error checking productTemplate:', e.message);
  }
}

test();
