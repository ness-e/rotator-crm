import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting full unified seeding process...\n');

    // 1. Roles
    console.log('📋 Seeding Roles...');
    const roles = [
        { name: 'SUPER_ADMIN', description: 'Super administrador con acceso total', permissions: '*', isSystem: true },
        { name: 'ADMIN', description: 'Administrador de organización', permissions: 'read,write', isSystem: true },
        { name: 'MEMBER', description: 'Miembro regular / Usuario estándar', permissions: 'read', isSystem: true },
        { name: 'BILLING', description: 'Acceso a facturación y licencias', permissions: 'billing', isSystem: true }
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {
                description: role.description,
                permissions: role.permissions,
                isSystem: role.isSystem
            },
            create: role
        });
    }
    console.log(`✅ Roles ready (${roles.length})`);

    // 2. Market Targets
    console.log('\n📋 Seeding Market Targets...');
    const marketTargets = [
        { abbreviation: 'IM', name: 'Investigación de Mercado' },
        { abbreviation: 'CO', name: 'Consultora' },
        { abbreviation: 'PN', name: 'Persona Natural' },
        { abbreviation: 'ONG', name: 'ONG / Sin Fines de Lucro' },
        { abbreviation: 'CORP', name: 'Corporación / Corporativo' },
        { abbreviation: 'FU', name: 'Fundación' },
        { abbreviation: 'UN', name: 'Universidad / Académico' },
        { abbreviation: 'GO', name: 'Gobierno' }
    ];

    for (const mt of marketTargets) {
        await prisma.marketTarget.upsert({
            where: { abbreviation: mt.abbreviation },
            update: { name: mt.name },
            create: mt
        });
    }
    console.log(`✅ Market Targets ready (${marketTargets.length})`);

    // 3. Pipeline Stages
    console.log('\n📋 Seeding Pipeline Stages...');
    const pipelineStages = [
        { value: 'NUEVO', label: 'Nuevo Prospecto', color: '#3b82f6', orderIndex: 1 },
        { value: 'CONTACTADO', label: 'Contactado', color: '#8b5cf6', orderIndex: 2 },
        { value: 'CALIFICADO', label: 'Calificado', color: '#ec4899', orderIndex: 3 },
        { value: 'REUNION', label: 'Reunión Agendada', color: '#a855f7', orderIndex: 4 },
        { value: 'PROPUESTA', label: 'Propuesta Enviada', color: '#f59e0b', orderIndex: 5 },
        { value: 'NEGOCIACION', label: 'En Negociación', color: '#10b981', orderIndex: 6 },
        { value: 'GANADO', label: 'Ganado / Cerrado', color: '#22c55e', orderIndex: 7 },
        { value: 'PERDIDO', label: 'Perdido', color: '#ef4444', orderIndex: 8 }
    ];

    for (const ps of pipelineStages) {
        await prisma.pipelineStage.upsert({
            where: { value: ps.value },
            update: {
                label: ps.label,
                color: ps.color,
                orderIndex: ps.orderIndex
            },
            create: ps
        });
    }
    console.log(`✅ Pipeline Stages ready (${pipelineStages.length})`);

    // 4. System Settings
    console.log('\n📋 Seeding System Settings...');
    const settings = [
        { key: 'APP_NAME', value: 'Rotator Survey Management', description: 'Nombre de la aplicación', group: 'GENERAL' },
        { key: 'DEFAULT_CURRENCY', value: 'USD', description: 'Moneda predeterminada', group: 'BILLING' },
        { key: 'LICENSE_EXPIRATION_DAYS', value: '365', description: 'Días de expiración de licencia por defecto', group: 'LICENSES' },
        { key: 'SUPPORT_EMAIL', value: 'soporte@rotatorsurvey.com', description: 'Email de soporte técnico', group: 'GENERAL' },
        { key: 'SMTP_HOST', value: 'smtp.gmail.com', description: 'Servidor SMTP para emails', group: 'EMAIL' },
        { key: 'SMTP_PORT', value: '587', description: 'Puerto SMTP', group: 'EMAIL' },
        { key: 'SMTP_USER', value: 'eros.messy@gmail.com', description: 'Usuario SMTP', group: 'EMAIL' }
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: {
                value: setting.value,
                description: setting.description,
                group: setting.group
            },
            create: setting
        });
    }
    console.log(`✅ System Settings ready (${settings.length})`);

    // 5. Product Templates
    console.log('\n📋 Seeding Product Templates...');
    const templates = [
        { code: 'ROT-BASIC', name: 'Rotator Basic', category: 'LICENSE', defaultQuestions: 50, defaultCases: 500, defaultAdmins: 1, basePrice: 99 },
        { code: 'ROT-PRO', name: 'Rotator Professional', category: 'LICENSE', defaultQuestions: 200, defaultCases: 2000, defaultAdmins: 3, basePrice: 299 },
        { code: 'ROT-ENT', name: 'Rotator Enterprise', category: 'LICENSE', defaultQuestions: 999, defaultCases: 9999, defaultAdmins: 10, basePrice: 800 },
        { code: 'HOST-STD', name: 'Cloud Hosting Standard', category: 'HOSTING', basePrice: 50, concurrentQuestionnaires: 5 },
        { code: 'HOST-PRO', name: 'Cloud Hosting Professional', category: 'HOSTING', basePrice: 150, concurrentQuestionnaires: 15 }
    ];

    for (const t of templates) {
        await prisma.productTemplate.upsert({
            where: { code: t.code },
            update: t,
            create: t
        });
    }
    console.log(`✅ Product Templates ready (${templates.length})`);

    // 6. Master Organization & Admin
    console.log('\n📋 Seeding Master Organization & Admin...');
    const rotatorOrg = await prisma.organization.upsert({
        where: { email: 'admin@rotatorsurvey.com' },
        update: { isMaster: true, isActive: true },
        create: {
            name: 'Rotator Survey',
            email: 'admin@rotatorsurvey.com',
            password: await bcrypt.hash('RotatorAdmin2026!', 10),
            taxId: 'J-12345678-9',
            countryCode: 'VE',
            isMaster: true,
            isActive: true,
            clientType: 'A'
        }
    });

    const masterAdmin = await prisma.user.upsert({
        where: { email: 'admin@rotatorsurvey.com' },
        update: { 
            role: 'SUPER_ADMIN', 
            organizationId: rotatorOrg.id,
            password: await bcrypt.hash('RotatorAdmin2026!', 10)
        },
        create: {
            email: 'admin@rotatorsurvey.com',
            password: await bcrypt.hash('RotatorAdmin2026!', 10),
            fullName: 'Master Admin',
            role: 'SUPER_ADMIN',
            organizationId: rotatorOrg.id,
            isActive: true
        }
    });
    console.log(`✅ Master Admin ready: ${masterAdmin.email}`);

    // 7. Demo Data (More Organizations and Users)
    console.log('\n📋 Seeding Demo Data...');
    const demoOrgs = [
        { name: 'Empresa Demo A', email: 'demo.a@example.com', countryCode: 'ES', clientType: 'B' },
        { name: 'Universidad de Prueba', email: 'u.prueba@example.com', countryCode: 'MX', clientType: 'C' }
    ];

    for (const orgData of demoOrgs) {
        const org = await prisma.organization.upsert({
            where: { email: orgData.email },
            update: orgData,
            create: {
                ...orgData,
                password: await bcrypt.hash('DemoPass2026!', 10),
                isActive: true
            }
        });

        const adminEmail = `admin@${orgData.email.split('@')[1]}`;
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: { 
                organizationId: org.id,
                password: await bcrypt.hash('DemoPass2026!', 10),
                fullName: `Admin ${orgData.name}`,
                role: 'ADMIN',
                isActive: true
            },
            create: {
                email: adminEmail,
                password: await bcrypt.hash('DemoPass2026!', 10),
                fullName: `Admin ${orgData.name}`,
                role: 'ADMIN',
                organizationId: org.id,
                isActive: true
            }
        });
    }
    console.log('✅ Demo Organizations & Admins ready');

    // 8. Server Nodes
    console.log('\n📋 Seeding Server Nodes...');
    const servers = [
        { id: 1, name: 'Cloud Rotator 01', type: 'cloud_rotator', status: 'active', provider: 'DigitalOcean', capacity: 100 },
        { id: 2, name: 'Cloud Rotator 02', type: 'cloud_rotator', status: 'active', provider: 'AWS', capacity: 200 }
    ];

    for (const s of servers) {
        await prisma.serverNode.upsert({
            where: { id: s.id },
            update: s,
            create: s
        });
    }
    console.log(`✅ Server Nodes ready (${servers.length})`);

    console.log('\n🏁 Full seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
