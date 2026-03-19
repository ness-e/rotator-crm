/**
 * @file add-file-headers.js
 * @description Script para agregar headers de documentación a archivos del proyecto
 * 
 * @usage
 * - Ejecutar: node maintenance-tools/add-file-headers.js
 * - Configurar metadata en file-metadata.json
 * 
 * @functionality
 * - Lee archivos .js/.jsx del proyecto
 * - Verifica si ya tienen header de documentación
 * - Agrega header estandarizado basado en metadata
 * - Genera reporte de archivos procesados
 * 
 * @author Sistema
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADER_TEMPLATE = `/**
 * @file {filename}
 * @description {description}
 * 
 * @usage
 * - Dónde se utiliza: {where}
 * - Cuándo se utiliza: {when}
 * 
 * @functionality
{functionality}
 * 
 * @dependencies
{dependencies}
 * 
 * @relatedFiles
{relatedFiles}
 * 
 * @module {module}
 * @category {category}
 * @lastUpdated {date}
 * @author Sistema
 */
`;

function hasHeader(content) {
    return content.trimStart().startsWith('/**');
}

function addHeaderToFile(filePath, metadata) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Check if header already exists
        if (hasHeader(content)) {
            console.log(`⏭️  Header already exists: ${filePath}`);
            return { status: 'skipped', file: filePath };
        }

        const header = HEADER_TEMPLATE
            .replace('{filename}', path.basename(filePath))
            .replace('{description}', metadata.description || 'Descripción pendiente')
            .replace('{where}', metadata.where || 'Pendiente de documentar')
            .replace('{when}', metadata.when || 'Pendiente de documentar')
            .replace('{functionality}', metadata.functionality?.map(f => ` * - ${f}`).join('\n') || ' * - Pendiente de documentar')
            .replace('{dependencies}', metadata.dependencies?.map(d => ` * - ${d}`).join('\n') || ' * - Ninguna')
            .replace('{relatedFiles}', metadata.relatedFiles?.map(f => ` * - ${f}`).join('\n') || ' * - Ninguno')
            .replace('{module}', metadata.module || 'Module')
            .replace('{category}', metadata.category || 'General')
            .replace('{date}', new Date().toISOString().split('T')[0]);

        const newContent = header + '\n\n' + content;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Added header to: ${filePath}`);
        return { status: 'added', file: filePath };
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return { status: 'error', file: filePath, error: error.message };
    }
}

function findJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            // Skip node_modules, dist, build, .git
            if (!['node_modules', 'dist', 'build', '.git', '.next'].includes(file)) {
                findJsFiles(filePath, fileList);
            }
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

async function main() {
    console.log('🚀 Starting file header documentation process...\n');

    // Load metadata if exists
    const metadataPath = path.join(__dirname, 'file-metadata.json');
    let metadata = {};

    if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log(`📋 Loaded metadata for ${Object.keys(metadata).length} files\n`);
    } else {
        console.log('⚠️  No metadata file found. Using default template.\n');
    }

    // Find all JS/JSX files
    const backendFiles = findJsFiles(path.join(__dirname, '../backend/src'));
    const frontendFiles = findJsFiles(path.join(__dirname, '../frontend/src'));

    const allFiles = [...backendFiles, ...frontendFiles];
    console.log(`📁 Found ${allFiles.length} files to process\n`);

    // Process files
    const results = {
        added: [],
        skipped: [],
        errors: []
    };

    allFiles.forEach(filePath => {
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        const fileMetadata = metadata[relativePath] || {};

        const result = addHeaderToFile(filePath, fileMetadata);
        results[result.status].push(result);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Headers added: ${results.added.length}`);
    console.log(`⏭️  Skipped (already had header): ${results.skipped.length}`);
    console.log(`❌ Errors: ${results.errors.length}`);
    console.log('='.repeat(50));

    if (results.errors.length > 0) {
        console.log('\n❌ Files with errors:');
        results.errors.forEach(r => console.log(`  - ${r.file}: ${r.error}`));
    }
}

main().catch(console.error);
