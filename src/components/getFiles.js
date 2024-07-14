const vscode = require('vscode');

const getFiles = async () => {
    const editor = vscode.window.activeTextEditor;

    const otherFiles = async () => {
        try {
            const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
            const result = {};

            for (const file of files) {
                try {
                    const relativePath = vscode.workspace.asRelativePath(file);
                    const content = await vscode.workspace.fs.readFile(file);
                    const parts = relativePath.split('/');
                    let current = result;

                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }

                    current[parts[parts.length - 1]] = {
                        path: relativePath,
                        content: content.toString()
                    };
                } catch (error) {
                    console.error(`Error reading file ${file.fsPath}: ${error.message}`);
                }
            }

            return result;
        } catch (error) {
            console.error(`Error in otherFiles function: ${error.message}`);
            return {};
        }
    }

    const fileStructure = await otherFiles();
    const editorContent = editor.document.getText();
    const importRegex = /(?:import\s+(?:{?\s*([\w\s,]+)\s*}?\s*from\s+['"]|(?:[\w\s,]+)\s+from\s+['"])|const\s+{?\s*([\w\s,]+)\s*}?\s*=\s*require\(['"])(.+?)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(editorContent)) !== null) {
        const functions = (match[1] || match[2] || '').split(',').map(f => f.trim()).filter(Boolean);
        imports.push(...functions);
    }

    const matchingFiles = [];

    const searchInFile = (content, filePath) => {
        for (const importItem of imports) {
            const regex = new RegExp(`(function\\s+${importItem}|const\\s+${importItem}\\s*=)`, 'g');
            if (regex.test(content)) {
                matchingFiles.push({
                    path: filePath,
                    content: content.substring(0, 100)
                });
                return;
            }
        }
    }

    const searchInFiles = (files) => {
        for (const file in files) {
            if (typeof files[file] === 'object' && files[file].content) {
                searchInFile(files[file].content, files[file].path);
            } else if (typeof files[file] === 'object') {
                searchInFiles(files[file]);
            }
        }
    }

    searchInFiles(fileStructure);

    const matchingFilesFiltered = matchingFiles.slice(0, 10);
    const matchingFilesJson = JSON.stringify(matchingFilesFiltered, null, 4);

    return matchingFilesFiltered;
}

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

module.exports = { getFiles, getImports };