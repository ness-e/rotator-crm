const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../backend/prisma/schema.prisma');
const outputPath = path.join(__dirname, '../database_schema.json');

try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const lines = schemaContent.split('\n');

    const schema = {
        tables: [],
        enums: []
    };

    let currentModel = null;

    lines.forEach(line => {
        const trimmed = line.trim();

        // Ignore comments and empty lines
        if (!trimmed || trimmed.startsWith('//')) return;

        // Start of model
        if (trimmed.startsWith('model ')) {
            const parts = trimmed.split(/\s+/);
            const name = parts[1];
            currentModel = {
                name: name,
                columns: [],
                indices: []
            };
            schema.tables.push(currentModel);
        }
        // End of model
        else if (trimmed === '}') {
            currentModel = null;
        }
        // Inside model
        else if (currentModel) {
            // Check for block attributes like @@map, @@index
            if (trimmed.startsWith('@@')) {
                // Parse block attributes if needed, for now just storing as metadata or ignoring
                if (trimmed.startsWith('@@map')) {
                    const mapMatch = trimmed.match(/@@map\("([^"]+)"\)/);
                    if (mapMatch) currentModel.map = mapMatch[1];
                }
                return;
            }

            // Fields
            // Format: name type modifiers attributes
            // e.g. id Int @id @default(autoincrement())
            // e.g. user User @relation(...)

            const parts = trimmed.split(/\s+/);
            const name = parts[0];
            const type = parts[1];

            // Basic filtering of relations vs scalars (simplified)
            // If type starts with uppercase and is not Int, String, Boolean, DateTime, Float, it might be a relation
            // But for visualization, we list everything.

            const column = {
                name: name,
                type: type,
                isId: trimmed.includes('@id'),
                isUnique: trimmed.includes('@unique'),
                isList: type.includes('[]'),
                isRequired: !type.includes('?'),
                raw: trimmed
            };

            currentModel.columns.push(column);
        }
    });

    console.log(`Parsed ${schema.tables.length} tables.`);

    const jsonOutput = JSON.stringify(schema, null, 2);
    fs.writeFileSync(outputPath, jsonOutput);
    console.log(`Schema exported to ${outputPath}`);

} catch (error) {
    console.error('Error parsing schema:', error);
}
