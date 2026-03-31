import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5180/api';

async function runTest() {
  console.log('=== Iniciando Test de Autogeneración de Licencias ===');
  let token = null;

  try {
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@rotatorsurvey.com',
        password: '123456'
    });
    token = loginRes.data.token;
  } catch(e) {
      console.error('No se pudo iniciar sesión:', e.response?.data || e.message);
      return;
  }

  try {
    const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
    
    console.log('1. Creando Organización de Prueba...');
    let createRes = await axios.post(`${API_URL}/crm/organizations`, {
        name: 'Auto Gen Test Org ' + Date.now(),
        countryCode: 'US',
        status: 'ACTIVO',
        website: 'testauto.com',
        email: 'org@testauto.com',
        useContactName: 'John',
        useContactLastName: 'DoeAuto',
        useContactEmail: 'johndoe' + Date.now() + '@testauto.com',
        adminContactName: 'Admin',
        adminContactLastName: 'Auto',
        adminContactEmail: 'admin' + Date.now() + '@testauto.com'
    }, axiosConfig);

    const org = createRes.data;
    console.log('✅ Organización creada:', org.id, org.name);

    console.log('2. Verificando Usuario Autogenerado...');
    const users = await prisma.user.findMany({ where: { organizationId: org.id } });
    if (users.length === 1) {
        console.log(`✅ Usuario creado automáticamente: ${users[0].firstName} ${users[0].lastName} (${users[0].email})`);
        
        console.log('3. Verificando Licencia Autogenerada...');
        const licenses = await prisma.license.findMany({ where: { ownedByUserId: users[0].id } });
        if (licenses.length === 1) {
            console.log(`✅ Licencia creada automáticamente: Serial: ${licenses[0].serialKey}, Límite Casos: ${licenses[0].limitCases}, Límite Cuestionarios: ${licenses[0].limitQuestions}`);
            if (licenses[0].serialKey.includes('JOD') || licenses[0].serialKey.includes('JDA')) {
                console.log(`✅ El generador de serial usó las iniciales correctamente (esperaba John Doe).`);
            } else {
                console.log(`⚠️ Iniciales del serial key: ${licenses[0].serialKey}`);
            }
        } else {
             console.error('❌ Falló la autogeneración de Licencia (se encontraron', licenses.length, 'licencias)');
        }
    } else {
         console.error('❌ Falló la autogeneración de Usuario (se encontraron', users.length, 'usuarios)');
    }

    // Limpieza
    console.log('Limpiando datos de prueba...');
    await prisma.license.deleteMany({ where: { organizationId: org.id } });
    await prisma.user.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log('✅ Base de datos limpia.');

  } catch (error) {
     console.error('❌ Error en el test:', error.response?.data || error.message);
  } finally {
     await prisma.$disconnect();
  }
}

runTest();
