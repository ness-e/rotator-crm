const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Eros\\SistemaDeUsuarios\\sistemaUnificado\\src\\locales\\es.json', 'utf8');

function findDuplicates(text) {
    const lines = text.split('\n');
    const keys = {};
    const duplicates = [];
    let currentPath = [];
    const stack = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.endsWith('{')) {
            const match = trimmed.match(/"([^"]+)":/);
            if (match) {
                const key = match[1];
                const fullPath = [...currentPath, key].join('.');
                if (keys[fullPath]) {
                    duplicates.push({ key: fullPath, line: index + 1 });
                }
                keys[fullPath] = true;
                currentPath.push(key);
                stack.push(true);
            } else {
                stack.push(false);
            }
        } else if (trimmed === '}' || trimmed === '},') {
            if (stack.pop()) {
                currentPath.pop();
            }
        } else {
            const match = trimmed.match(/"([^"]+)":/);
            if (match) {
                const key = match[1];
                const fullPath = [...currentPath, key].join('.');
                if (keys[fullPath]) {
                    duplicates.push({ key: fullPath, line: index + 1 });
                }
                keys[fullPath] = true;
            }
        }
    });
    return duplicates;
}

const duplicates = findDuplicates(content);
console.log(JSON.stringify(duplicates, null, 2));
