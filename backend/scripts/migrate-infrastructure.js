import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const newDbPath = path.join(__dirname, '../prisma/rotator.db');
const oldDbPath = path.join(__dirname, '../prisma/rotator.db.bak');

console.log('Starting data migration...');

try {
  const newDb = new Database(newDbPath);
  // Attach old DB so we can copy easily using SQL
  newDb.exec(`ATTACH DATABASE '${oldDbPath.replace(/\\/g, '/')}' AS oldDb`);

  // Disable foreign keys temporarily BEFORE transaction
  newDb.exec('PRAGMA foreign_keys = OFF');

  newDb.exec('BEGIN TRANSACTION');

  const allNewTables = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'").all();
  
  // Clear any data the seed script might have inserted during the Prisma reset
  for (const t of allNewTables) {
    newDb.exec(`DELETE FROM main."${t.name}"`);
  }

  const unchangedTables = [
    'User',
    'MarketTarget',
    'ProductTemplate',
    'HostingPlan',
    'Domain',
    'ActivationLog',
    'licencias_en_activacion',
    'audit_logs'
  ];

  /* 
    There is a trick here: in SQLite, if we just do "INSERT INTO newDb.table SELECT * FROM oldDb.table"
    it assumes the columns match exactly in order and count.
    A safer way is to get the column names from the NEW db and use them in the SELECT, 
    but for unchanged tables, * if they exist in oldDb *, we just select the ones that exist in newDB.
  */

  const getCols = (tableName) => {
    const cols = newDb.pragma(`table_info("${tableName}")`);
    return cols.map(c => `"${c.name}"`).join(', ');
  };

  const getOldCols = (tableName) => {
    const cols = newDb.pragma(`oldDb.table_info("${tableName}")`);
    return cols.map(c => `"${c.name}"`);
  };

  // Helper to safely copy matching columns
  const copyTableSafe = (tableName) => {
    const newColumns = newDb.pragma(`table_info("${tableName}")`).map(c => c.name);
    const oldColumns = newDb.pragma(`oldDb.table_info("${tableName}")`).map(c => c.name);
    
    // Find intersection
    const commonCols = newColumns.filter(c => oldColumns.includes(c));
    
    if (commonCols.length === 0) {
      console.log(`Skipping ${tableName} (no common columns or doesn't exist in old DB)`);
      return;
    }
    
    const colStr = commonCols.map(c => `"${c}"`).join(', ');
    
    console.log(`Copying table: ${tableName}`);
    try {
      newDb.exec(`INSERT INTO main."${tableName}" (${colStr}) SELECT ${colStr} FROM oldDb."${tableName}"`);
    } catch (e) {
      console.log(`Error copying ${tableName}:`, e.message);
    }
  };

  // 1. Copy unchanged tables
  const tablesToCopy = newDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations'").all();
  
  for (const t of tablesToCopy) {
    const tableName = t.name;
    // We handle ServerNode, licenses manually to do the relations
    if (tableName === 'server_nodes' || tableName === 'licenses' || tableName === 'providers' || tableName === 'provider_plans' || tableName === 'license_servers') {
      continue; 
    }
    copyTableSafe(tableName);
  }

  // 2. Handle server_nodes and extract providers
  console.log('Copying server_nodes and creating providers...');
  
  // Get all old server nodes
  const oldServers = newDb.prepare('SELECT * FROM oldDb."server_nodes"').all();
  
  // Insert query for new server nodes
  const newServerCols = newDb.pragma(`table_info("server_nodes")`).map(c => c.name);
  const insertServerQuery = `
    INSERT INTO main."server_nodes" (${newServerCols.map(c=>`"${c}"`).join(', ')}) 
    VALUES (${newServerCols.map(()=>'?').join(', ')})
  `;
  const insertServerStmt = newDb.prepare(insertServerQuery);

  const providerMap = new Map(); // name -> id

  for (const oldSrv of oldServers) {
    let providerId = null;
    
    if (oldSrv.provider && oldSrv.provider.trim() !== '') {
      const pName = oldSrv.provider.trim();
      if (!providerMap.has(pName)) {
        // Create provider
        const res = newDb.prepare('INSERT INTO main."providers" ("name", "isActive") VALUES (?, 1)').run(pName);
        providerMap.set(pName, res.lastInsertRowid);
      }
      providerId = providerMap.get(pName);
    }
    
    // Build insert params
    const params = newServerCols.map(col => {
      if (col === 'providerId') return providerId;
      if (col === 'providerPlanId') return null;
      if (col === 'organizationId') return null; // Old DB didn't have this
      return oldSrv[col] !== undefined ? oldSrv[col] : null;
    });
    
    insertServerStmt.run(params);
  }

  // 3. Handle licenses and create license_servers
  console.log('Copying licenses and creating license_servers...');
  const oldLicenses = newDb.prepare('SELECT * FROM oldDb."licenses"').all();
  
  const newLicenseCols = newDb.pragma(`table_info("licenses")`).map(c => c.name);
  const insertLicenseQuery = `
    INSERT INTO main."licenses" (${newLicenseCols.map(c=>`"${c}"`).join(', ')}) 
    VALUES (${newLicenseCols.map(()=>'?').join(', ')})
  `;
  const insertLicenseStmt = newDb.prepare(insertLicenseQuery);
  const insertLicenseServerStmt = newDb.prepare('INSERT INTO main."license_servers" ("licenseId", "serverId") VALUES (?, ?)');

  for (const oldLic of oldLicenses) {
    // Insert license
    const params = newLicenseCols.map(col => {
      return oldLic[col] !== undefined ? oldLic[col] : null;
    });
    insertLicenseStmt.run(params);
    
    // If it had a serverNodeId, link it
    if (oldLic.serverNodeId) {
      insertLicenseServerStmt.run(oldLic.id, oldLic.serverNodeId);
    }
  }

  newDb.exec('COMMIT');
  console.log('Data migration complete!');

} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
