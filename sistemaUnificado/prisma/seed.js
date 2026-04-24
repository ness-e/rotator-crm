import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting full unified seeding process...\n');

    // ─────────────────────────────────────────────────────────
    // 1. ROLES (4 roles alineados al plan de implementación)
    // ─────────────────────────────────────────────────────────
    console.log('📋 Seeding Roles...');
    const roles = [
        { name: 'MASTER', description: 'Administrador maestro de Rotator Software — acceso total', permissions: JSON.stringify(['*']), isSystem: true },
        { name: 'ANALISTA', description: 'Analista interno de Rotator Software', permissions: JSON.stringify(['users.view','users.create','users.edit','licenses.view','licenses.create','licenses.edit','crm.view','crm.manage','prospects.view','prospects.manage','stats.view','servers.view','domains.view']), isSystem: true },
        { name: 'VISUALIZADOR', description: 'Visualizador interno de Rotator Software — solo lectura', permissions: JSON.stringify(['users.view','licenses.view','crm.view','prospects.view','stats.view','servers.view','domains.view']), isSystem: true },
        { name: 'CLIENTE', description: 'Usuario de organización cliente', permissions: JSON.stringify(['licenses.view','stats.view']), isSystem: true }
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

    // ─────────────────────────────────────────────────────────
    // 2. HOSTING PLANS (7 base del legacy maestro_hosting)
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Hosting Plans...');
    const hostingPlans = [
        { name: 'Por Defecto', abbreviation: 'DEF', concurrentQuestionnaires: 2 },
        { name: 'Plan Bronze', abbreviation: 'BRZ', concurrentQuestionnaires: 5 },
        { name: 'Plan Silver', abbreviation: 'SIL', concurrentQuestionnaires: 10 },
        { name: 'Plan Gold', abbreviation: 'GOL', concurrentQuestionnaires: 15 },
        { name: 'Plan Platinum', abbreviation: 'PLT', concurrentQuestionnaires: 30 },
        { name: 'Privado', abbreviation: 'PRI', concurrentQuestionnaires: 9999999 },
        { name: 'Propio', abbreviation: 'PRO', concurrentQuestionnaires: 9999999 },
    ];

    for (const hp of hostingPlans) {
        await prisma.hostingPlan.upsert({
            where: { abbreviation: hp.abbreviation },
            update: { name: hp.name, concurrentQuestionnaires: hp.concurrentQuestionnaires },
            create: hp
        });
    }
    console.log(`✅ Hosting Plans ready (${hostingPlans.length})`);

    // ─────────────────────────────────────────────────────────
    // 3. PRODUCT TEMPLATES (13 base del legacy licencias_version)
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Product Templates (13 Legacy Plans)...');
    const productTemplates = [
        {
            code: 'ST', versionId: 0, abbreviation: 'ST', name: 'Starter Edition', category: 'STARTER',
            defaultQuestions: 15, defaultCases: 100, defaultAdmins: 1,
            defaultMobileUsers: 1, defaultPhoneUsers: 1, defaultDataEntries: 1,
            defaultAnalysts: 1, defaultClients: 1, defaultClassifiers: 1,
            defaultCaptureSupervisors: 1, defaultKioskSupervisors: 1,
            defaultParticipants: 1000, concurrentQuestionnaires: 2,
            defaultServerType: 0
        },
        {
            code: 'EV', versionId: 1, abbreviation: 'EV', name: 'Evaluation Edition', category: 'TRIAL',
            defaultQuestions: 10, defaultCases: 50, defaultAdmins: 1,
            defaultMobileUsers: 1, defaultPhoneUsers: 1, defaultDataEntries: 1,
            defaultAnalysts: 1, defaultClients: 1, defaultClassifiers: 1,
            defaultCaptureSupervisors: 1, defaultKioskSupervisors: 1,
            defaultParticipants: 100, concurrentQuestionnaires: 1,
            defaultServerType: 0
        },
        {
            code: 'AC', versionId: 2, abbreviation: 'AC', name: 'Academia Edition', category: 'ACADEMIC',
            defaultQuestions: 50, defaultCases: 500, defaultAdmins: 1,
            defaultMobileUsers: 1, defaultPhoneUsers: 1, defaultDataEntries: 1,
            defaultAnalysts: 1, defaultClients: 1, defaultClassifiers: 1,
            defaultCaptureSupervisors: 1, defaultKioskSupervisors: 1,
            defaultParticipants: 500, concurrentQuestionnaires: 2,
            defaultServerType: 0
        },
        {
            code: 'PR', versionId: 3, abbreviation: 'PR', name: 'Professional Edition', category: 'PROFESSIONAL',
            defaultQuestions: 100, defaultCases: 1000, defaultAdmins: 2,
            defaultMobileUsers: 5, defaultPhoneUsers: 5, defaultDataEntries: 5,
            defaultAnalysts: 5, defaultClients: 5, defaultClassifiers: 5,
            defaultCaptureSupervisors: 5, defaultKioskSupervisors: 5,
            defaultParticipants: 5000, concurrentQuestionnaires: 5,
            defaultServerType: 0
        },
        {
            code: 'EE', versionId: 4, abbreviation: 'EE', name: 'Enterprise Edition', category: 'ENTERPRISE',
            defaultQuestions: 500, defaultCases: 5000, defaultAdmins: 10,
            defaultMobileUsers: 25, defaultPhoneUsers: 25, defaultDataEntries: 25,
            defaultAnalysts: 25, defaultClients: 25, defaultClassifiers: 25,
            defaultCaptureSupervisors: 25, defaultKioskSupervisors: 25,
            defaultParticipants: 25000, concurrentQuestionnaires: 10,
            defaultServerType: 0
        },
        {
            code: 'UN', versionId: 5, abbreviation: 'UN', name: 'University Edition', category: 'ACADEMIC',
            defaultQuestions: 100, defaultCases: 2000, defaultAdmins: 3,
            defaultMobileUsers: 10, defaultPhoneUsers: 10, defaultDataEntries: 10,
            defaultAnalysts: 10, defaultClients: 10, defaultClassifiers: 10,
            defaultCaptureSupervisors: 10, defaultKioskSupervisors: 10,
            defaultParticipants: 10000, concurrentQuestionnaires: 5,
            defaultServerType: 0
        },
        {
            code: 'PF', versionId: 6, abbreviation: 'PF', name: 'Professor Edition', category: 'ACADEMIC',
            defaultQuestions: 50, defaultCases: 500, defaultAdmins: 1,
            defaultMobileUsers: 5, defaultPhoneUsers: 5, defaultDataEntries: 5,
            defaultAnalysts: 5, defaultClients: 5, defaultClassifiers: 5,
            defaultCaptureSupervisors: 5, defaultKioskSupervisors: 5,
            defaultParticipants: 2000, concurrentQuestionnaires: 3,
            defaultServerType: 0
        },
        {
            code: 'DO', versionId: 7, abbreviation: 'DO', name: 'Donation Edition', category: 'NONPROFIT',
            defaultQuestions: 50, defaultCases: 500, defaultAdmins: 1,
            defaultMobileUsers: 5, defaultPhoneUsers: 5, defaultDataEntries: 5,
            defaultAnalysts: 5, defaultClients: 5, defaultClassifiers: 5,
            defaultCaptureSupervisors: 5, defaultKioskSupervisors: 5,
            defaultParticipants: 2000, concurrentQuestionnaires: 3,
            defaultServerType: 0
        },
        {
            code: 'IN', versionId: 8, abbreviation: 'IN', name: 'Individuals', category: 'INDIVIDUAL',
            defaultQuestions: 50, defaultCases: 2000, defaultAdmins: 1,
            defaultMobileUsers: 5, defaultPhoneUsers: 5, defaultDataEntries: 5,
            defaultAnalysts: 5, defaultClients: 5, defaultClassifiers: 5,
            defaultCaptureSupervisors: 5, defaultKioskSupervisors: 5,
            defaultParticipants: 20000, concurrentQuestionnaires: 5,
            defaultServerType: 0
        },
        {
            code: 'FX', versionId: 9, abbreviation: 'FX', name: 'Flex Teams', category: 'TEAM',
            defaultQuestions: 100, defaultCases: 10000, defaultAdmins: 5,
            defaultMobileUsers: 50, defaultPhoneUsers: 50, defaultDataEntries: 50,
            defaultAnalysts: 50, defaultClients: 50, defaultClassifiers: 50,
            defaultCaptureSupervisors: 50, defaultKioskSupervisors: 50,
            defaultParticipants: 50000, concurrentQuestionnaires: 20,
            defaultServerType: 0
        },
        {
            code: 'EN', versionId: 10, abbreviation: 'EN', name: 'Enterprises', category: 'ENTERPRISE',
            defaultQuestions: 99999, defaultCases: 99999, defaultAdmins: 100,
            defaultMobileUsers: 99999, defaultPhoneUsers: 99999, defaultDataEntries: 99999,
            defaultAnalysts: 99999, defaultClients: 99999, defaultClassifiers: 99999,
            defaultCaptureSupervisors: 99999, defaultKioskSupervisors: 99999,
            defaultParticipants: 99999, concurrentQuestionnaires: 999999,
            defaultServerType: 0
        },
        {
            code: 'TB', versionId: 11, abbreviation: 'TB', name: 'Team Basic', category: 'TEAM',
            defaultQuestions: 100, defaultCases: 5000, defaultAdmins: 5,
            defaultMobileUsers: 25, defaultPhoneUsers: 25, defaultDataEntries: 25,
            defaultAnalysts: 25, defaultClients: 25, defaultClassifiers: 25,
            defaultCaptureSupervisors: 25, defaultKioskSupervisors: 25,
            defaultParticipants: 30000, concurrentQuestionnaires: 10,
            defaultServerType: 0
        },
        {
            code: 'TP', versionId: 12, abbreviation: 'TP', name: 'Team Premier', category: 'TEAM',
            defaultQuestions: 200, defaultCases: 10000, defaultAdmins: 15,
            defaultMobileUsers: 50, defaultPhoneUsers: 50, defaultDataEntries: 50,
            defaultAnalysts: 50, defaultClients: 50, defaultClassifiers: 50,
            defaultCaptureSupervisors: 50, defaultKioskSupervisors: 50,
            defaultParticipants: 40000, concurrentQuestionnaires: 15,
            defaultServerType: 0
        },
    ];

    for (const t of productTemplates) {
        await prisma.productTemplate.upsert({
            where: { code: t.code },
            update: {
                name: t.name, category: t.category, abbreviation: t.abbreviation, versionId: t.versionId,
                defaultQuestions: t.defaultQuestions, defaultCases: t.defaultCases, defaultAdmins: t.defaultAdmins,
                defaultMobileUsers: t.defaultMobileUsers, defaultPhoneUsers: t.defaultPhoneUsers,
                defaultDataEntries: t.defaultDataEntries, defaultAnalysts: t.defaultAnalysts,
                defaultClients: t.defaultClients, defaultClassifiers: t.defaultClassifiers,
                defaultCaptureSupervisors: t.defaultCaptureSupervisors,
                defaultKioskSupervisors: t.defaultKioskSupervisors,
                defaultParticipants: t.defaultParticipants,
                concurrentQuestionnaires: t.concurrentQuestionnaires,
                defaultServerType: t.defaultServerType
            },
            create: t
        });
    }
    console.log(`✅ Product Templates ready (${productTemplates.length})`);

    // ─────────────────────────────────────────────────────────
    // 4. MARKET TARGETS
    // ─────────────────────────────────────────────────────────
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

    // ─────────────────────────────────────────────────────────
    // 5. PIPELINE STAGES
    // ─────────────────────────────────────────────────────────
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
            update: { label: ps.label, color: ps.color, orderIndex: ps.orderIndex },
            create: ps
        });
    }
    console.log(`✅ Pipeline Stages ready (${pipelineStages.length})`);

    // ─────────────────────────────────────────────────────────
    // 6. SYSTEM SETTINGS
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding System Settings...');
    const settings = [
        { key: 'APP_NAME', value: 'Rotator Survey Management', description: 'Nombre de la aplicación', group: 'GENERAL' },
        { key: 'DEFAULT_CURRENCY', value: 'USD', description: 'Moneda predeterminada', group: 'BILLING' },
        { key: 'LICENSE_EXPIRATION_DAYS', value: '365', description: 'Días de expiración de licencia por defecto', group: 'LICENSES' },
        { key: 'SUPPORT_EMAIL', value: 'soporte@rotatorsurvey.com', description: 'Email de soporte técnico', group: 'GENERAL' },
        { key: 'SMTP_HOST', value: 'smtp.gmail.com', description: 'Servidor SMTP para emails', group: 'EMAIL' },
        { key: 'SMTP_PORT', value: '587', description: 'Puerto SMTP', group: 'EMAIL' },
        { key: 'SMTP_USER', value: 'eros.messy@gmail.com', description: 'Usuario SMTP', group: 'EMAIL' },
        { key: 'XOR_MAGIC_WORD', value: 'yiyo', description: 'Palabra mágica para encriptación XOR de licencias', group: 'LICENSES' },
        { key: 'SOFTWARE_VERSION_MAJOR', value: '4', description: 'Versión major del software desktop', group: 'LICENSES' },
        { key: 'SOFTWARE_VERSION_MINOR', value: '3', description: 'Versión minor del software desktop', group: 'LICENSES' },
        { key: 'MAINTENANCE_MODE', value: 'false', description: 'Activar modo mantenimiento (bloquea acceso no administrativo)', group: 'ADVANCED' },
        { key: 'SESSION_TIMEOUT', value: '3600', description: 'Tiempo de sesión en segundos (inactividad)', group: 'ADVANCED' },
        { key: 'PASSWORD_POLICY', value: 'medium', description: 'Política de complejidad de contraseñas (low, medium, high)', group: 'ADVANCED' },
        { key: 'ADMIN_EMAIL', value: 'admin@rotatorsurvey.com', description: 'Correo del administrador', group: 'ADVANCED' },
        { key: 'REPORT_EMAILS', value: 'admin@rotatorsurvey.com, soporte@rotatorsurvey.com', description: 'Correos para reportes (separados por coma, sufijo @rotatorsurvey.com)', group: 'ADVANCED' },
    ];

    for (const setting of settings) {
        await prisma.systemSetting.upsert({
            where: { key: setting.key },
            update: { value: setting.value, description: setting.description, group: setting.group },
            create: setting
        });
    }
    console.log(`✅ System Settings ready (${settings.length})`);

    // ─────────────────────────────────────────────────────────
    // 7. PROVIDERS
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Providers...');
    const providers = [
        { name: '247-host' },
        { name: 'Mocha Host' },
        { name: 'Rotator Software' }
    ];

    for (const p of providers) {
        await prisma.provider.upsert({
            where: { name: p.name },
            update: { name: p.name },
            create: p
        });
    }
    console.log(`✅ Providers ready (${providers.length})`);

    // ─────────────────────────────────────────────────────────
    // 8. SERVER NODES (Cloud & Legacy)
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Server Nodes...');
    
    // Default cloud names
    const cloudNames = ['ZEUS', 'ARTEMIS', 'HERMES', 'PERSEUS', 'EROS', 'HERA'];
    
    for (const name of cloudNames) {
        const lowerName = name.toLowerCase();
        const primaryDomain = `${lowerName}.rotatorserver.com`;
        const additionalDomain = `${lowerName}.rotatorcapi.com`;

        const server = await prisma.serverNode.upsert({
            where: { primaryDomain },
            update: {
                name: name,
                type: 'CLOUD',
                status: 'active'
            },
            create: {
                name: name,
                type: 'CLOUD',
                status: 'active',
                primaryDomain: primaryDomain
            }
        });

        // Add additional domains
        const domainsToAdd = [additionalDomain];
        if (name === 'ZEUS') domainsToAdd.push('rotatorserver.com');
        if (name === 'HERA') domainsToAdd.push('rotatorcapi.com');

        for (const d of domainsToAdd) {
            await prisma.domain.upsert({
                where: { domainName: d },
                update: { serverId: server.id },
                create: { domainName: d, serverId: server.id, isPropio: false, status: 'active' }
            });
        }
    }

    // Add legacy types if not present
    const extraNodes = [
        { name: 'Servidor Privado', type: 'PRIVATE', status: 'active' },
        { name: 'Servidor Propio', type: 'OWN', status: 'active' },
    ];

    for (const s of extraNodes) {
        const existing = await prisma.serverNode.findFirst({ where: { name: s.name } });
        if (!existing) {
            await prisma.serverNode.create({ data: s });
        }
    }
    console.log(`✅ Server Nodes ready (${cloudNames.length + 2})`);

    // ─────────────────────────────────────────────────────────
    // 9. MASTER ORG + ADMIN USER
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Master Organization & Admin...');
    const rotatorOrg = await prisma.organization.upsert({
        where: { email: 'admin@rotatorsurvey.com' },
        update: { isMaster: true, isActive: true, name: 'Rotator Software' },
        create: {
            name: 'Rotator Software',
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
            role: 'MASTER',
            organizationId: rotatorOrg.id,
            password: await bcrypt.hash('RotatorAdmin2026!', 10)
        },
        create: {
            email: 'admin@rotatorsurvey.com',
            password: await bcrypt.hash('RotatorAdmin2026!', 10),
            firstName: 'Abraham',
            lastName: 'Barrientos',
            role: 'MASTER',
            organizationId: rotatorOrg.id,
            isActive: true
        }
    });
    console.log(`✅ Master Admin ready: ${masterAdmin.email}`);

    // ─────────────────────────────────────────────────────────
    // 10. DEMO DATA (Organizations + CLIENTE Users)
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Demo Data...');
    const demoOrgs = [
        { name: 'Empresa Demo A', email: 'demo.a@example.com', countryCode: 'ES', clientType: 'C' },
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
                firstName: 'Admin',
                lastName: orgData.name,
                role: 'CLIENTE',
                isActive: true
            },
            create: {
                email: adminEmail,
                password: await bcrypt.hash('DemoPass2026!', 10),
                firstName: 'Admin',
                lastName: orgData.name,
                role: 'CLIENTE',
                organizationId: org.id,
                isActive: true
            }
        });
    }
    console.log('✅ Demo Organizations & Clients ready');
    
    // ─────────────────────────────────────────────────────────
    // 11. EMAIL TEMPLATES
    // ─────────────────────────────────────────────────────────
    console.log('\n📋 Seeding Email Templates...');
    const emailTemplates = [
        {
            code: 'WELCOME_USER',
            name: 'Bienvenida a Usuario',
            subject: '¡Bienvenido a Rotator Survey!',
            body: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #3b82f6;">Hola {{firstName}}</h2>
                    <p>Tu cuenta ha sido creada exitosamente en <strong>Rotator Survey</strong>.</p>
                    <p>Puedes acceder con tu correo: {{email}}</p>
                    <br/>
                    <a href="{{loginUrl}}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acceder al Sistema</a>
                </div>
            `,
            variables: '["firstName", "email", "loginUrl"]'
        },
        {
            code: 'PASSWORD_RESET',
            name: 'Recuperación de Contraseña',
            subject: 'Instrucciones para restablecer tu contraseña',
            body: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #3b82f6;">Restablecer Contraseña</h2>
                    <p>Hemos recibido una solicitud para cambiar tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para continuar:</p>
                    <br/>
                    <a href="{{resetUrl}}" style="background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer ahora</a>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">Si no solicitaste esto, puedes ignorar este correo.</p>
                </div>
            `,
            variables: '["resetUrl"]'
        },
        {
            code: 'LICENSE_EXPIRING',
            name: 'Aviso de Expiración de Licencia',
            subject: 'Tu licencia de Rotator Survey está por expirar',
            body: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #f59e0b; border-radius: 10px;">
                    <h2 style="color: #f59e0b;">Aviso de Expiración</h2>
                    <p>Tu licencia <strong>{{licenseCode}}</strong> expirará el <strong>{{expiryDate}}</strong>.</p>
                    <p>Te recomendamos renovarla pronto para evitar interrupciones en el servicio.</p>
                    <br/>
                    <a href="{{renewalUrl}}" style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renovar Licencia</a>
                </div>
            `,
            variables: '["licenseCode", "expiryDate", "renewalUrl"]'
        }
    ];

    for (const t of emailTemplates) {
        await prisma.emailTemplate.upsert({
            where: { code: t.code },
            update: {
                name: t.name,
                subject: t.subject,
                body: t.body,
                variables: t.variables
            },
            create: t
        });
    }
    console.log(`✅ Email Templates ready (${emailTemplates.length})`);

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
