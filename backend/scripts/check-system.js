import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 System Health Check & Data Audit\n');
    console.log('='.repeat(50));

    try {
        // --- 1. Table Counts ---
        console.log('📊 Table Statistics:');
        const stats = [
            { table: 'Organizations', count: await prisma.organization.count() },
            { table: 'Users', count: await prisma.user.count() },
            { table: 'Roles', count: await prisma.role.count() },
            { table: 'Product Templates', count: await prisma.productTemplate.count() },
            { table: 'Licenses', count: await prisma.license.count() },
            { table: 'Server Nodes', count: await prisma.serverNode.count() },
            { table: 'Pipeline Stages', count: await prisma.pipelineStage.count() },
            { table: 'Market Targets', count: await prisma.marketTarget.count() },
            { table: 'Purchase Intents', count: await prisma.purchaseIntent.count() },
            { table: 'Prospects', count: await prisma.prospect.count() },
            { table: 'System Settings', count: await prisma.systemSetting.count() },
            { table: 'Audit Logs', count: await prisma.auditLog.count() }
        ];

        console.table(stats);

        // --- 2. Consistency Checks ---
        console.log('\n⚖️ Consistency Checks:');
        
        const usersWithoutOrg = await prisma.user.count({ where: { organizationId: null } });
        console.log(`- Users without Organization: ${usersWithoutOrg === 0 ? '✅ 0' : '⚠️ ' + usersWithoutOrg}`);

        const masterOrgs = await prisma.organization.count({ where: { isMaster: true } });
        console.log(`- Master Organizations: ${masterOrgs === 1 ? '✅ 1' : '❌ ' + masterOrgs}`);

        const superAdmins = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
        console.log(`- Super Admins: ${superAdmins >= 1 ? '✅ ' + superAdmins : '❌ 0'}`);

        // --- 3. Feature Verification ---
        console.log('\n⚙️ System Configuration:');
        const appName = await prisma.systemSetting.findUnique({ where: { key: 'APP_NAME' } });
        console.log(`- App Name: ${appName ? '✅ ' + appName.value : '❌ Undefined'}`);

        const activeServers = await prisma.serverNode.count({ where: { status: 'active' } });
        console.log(`- Active Server Nodes: ${activeServers >= 1 ? '✅ ' + activeServers : '⚠️ 0'}`);

        console.log('\n' + '='.repeat(50));
        console.log('✅ Audit completed.');

    } catch (error) {
        console.error('\n❌ Audit error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
