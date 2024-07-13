const vscode = require('vscode');

const Input = async ({ selectedText }) => {
    const userPrompt = await vscode.window.showInputBox({
        placeHolder: selectedText ? '🐿️ Write a prompt to change the selected code.' : '🐿️ Write a prompt to generate code.',
        validateInput: (value) => {
            if (!value) {
                return 'Prompt cannot be empty';
            }
            return null;
        },
        ignoreFocusOut: true,
    });

    return userPrompt;
}

module.exports = { Input };