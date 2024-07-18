const vscode = require('vscode');

const getImports = (text) => {
    const importRegex = /(?:import\s+(?:{?\s*([\w\s,]+)\s*}?\s*from\s+['"]|(?:[\w\s,]+)\s+from\s+['"])|const\s+{?\s*([\w\s,]+)\s*}?\s*=\s*require\(['"])(.+?)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(text)) !== null) {
        const functions = (match[1] || match[2] || '').split(',').map(f => f.trim()).filter(Boolean);
        const moduleName = match[3];
        imports.push({ functions, moduleName });
    }
    return imports;
};

module.exports = { getImports };