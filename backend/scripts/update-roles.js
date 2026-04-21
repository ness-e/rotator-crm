import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateRoles() {
    console.log('Actualizando roles por defecto...');
    const roles = [
        { name: 'MASTER', description: 'Administrador maestro de Rotator Software — acceso total', permissions: '*', isSystem: true },
        { name: 'ANALISTA', description: 'Analista interno de Rotator Software', permissions: 'users.view,users.create,users.edit,licenses.view,licenses.create,licenses.edit,crm.view,crm.manage,prospects.view,prospects.manage,stats.view,servers.view,domains.view', isSystem: true },
        { name: 'VISUALIZADOR', description: 'Visualizador interno de Rotator Software — solo lectura', permissions: 'users.view,licenses.view,crm.view,prospects.view,stats.view,servers.view,domains.view', isSystem: true },
        { name: 'CLIENTE', description: 'Usuario de organización cliente', permissions: 'licenses.view,stats.view', isSystem: true }
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
        console.log(`Rol ${role.name} actualizado.`);
    }
    console.log('Todos los roles por defecto han sido actualizados en la base de datos.');
}

updateRoles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
