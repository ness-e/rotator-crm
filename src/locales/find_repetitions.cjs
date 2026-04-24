const fs = require('fs');
const content = JSON.parse(fs.readFileSync('c:\\Users\\Eros\\SistemaDeUsuarios\\sistemaUnificado\\src\\locales\\es.json', 'utf8'));

function findIdenticalValues(obj, path = '', values = {}) {
    for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        const val = obj[key];
        if (typeof val === 'object' && val !== null) {
            findIdenticalValues(val, fullPath, values);
        } else if (typeof val === 'string') {
            if (!values[val]) {
                values[val] = [];
            }
            values[val].push(fullPath);
        }
    }
    return values;
}

const values = findIdenticalValues(content);
const repetitions = Object.entries(values).filter(([val, paths]) => paths.length > 1);

repetitions.sort((a, b) => b[1].length - a[1].length);

console.log(JSON.stringify(repetitions.slice(0, 50), null, 2));
