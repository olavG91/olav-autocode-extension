const vscode = require('vscode');

const Input = async ({ selectedText }) => {
    const userPrompt = await vscode.window.showInputBox({
        prompt: selectedText ? 'Enter your prompt to change the selected code' : 'Enter your prompt',
        placeHolder: selectedText ? 'Write a prompt to change the selected code.' : 'Write a prompt to generate code.',
        validateInput: (value) => {
            if (!value) {
                return 'Prompt cannot be empty';
            }
            return null;
        },
    });

    return userPrompt;
}

const Buttons = async () => {
    const items = [
        { label: 'Keep', description: 'Keep the selected code as it is', iconPath: new vscode.ThemeIcon('check') },
        { label: 'Rerun', description: 'Rerun the prompt', iconPath: new vscode.ThemeIcon('refresh') },
        { label: 'Reset', description: 'Reset the selected code to its original state', iconPath: new vscode.ThemeIcon('close') },
    ];
    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an action',
        matchOnDescription: true,
        matchOnDetail: true,
        ignoreFocusOut: true,
    });
    return selected ? selected.label : null;
}

const executeAction = async (action) => {
    switch (action) {
        case 'Prompt':
            return await generateCode();
        case 'Prompt Selected':
            return await modifySelectedCode();
        case 'Explain Code':
            return await explainCode();
        case 'Optimize Code':
            return await optimizeCode();
        case 'Refactor Code':
            return await refactorCode();
        case 'Generate Tests':
            return await generateTests();
        case 'Document Code':
            return await documentCode();
        default:
            return null;
    }
}

const generateCode = async () => {
    // Implementation for generating code
}

const modifySelectedCode = async () => {
    // Implementation for modifying selected code
}

const explainCode = async () => {
    // Implementation for explaining code
}

const optimizeCode = async () => {
    // Implementation for optimizing code
}

const refactorCode = async () => {
    // Implementation for refactoring code
}

const generateTests = async () => {
    // Implementation for generating tests
}

const documentCode = async () => {
    // Implementation for documenting code
}

module.exports = { Input, Buttons };