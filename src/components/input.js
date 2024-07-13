const vscode = require('vscode');

const Input = async ({ selectedText }) => {
    const prompt = await vscode.window.showInputBox({
        prompt: selectedText ? 'Enter your prompt to change the selected code' : 'Enter your prompt',
        placeHolder: 'Prompt',
        validateInput: (value) => {
            if (!value) {
                return 'Prompt cannot be empty';
            }
            return null;
        },
        ignoreFocusOut: true,
        buttons: [
            {
                iconPath: new vscode.ThemeIcon('add'),
                tooltip: 'Add a new button'
            },
            {
                iconPath: new vscode.ThemeIcon('clear-all'),
                tooltip: 'Clear all buttons'
            }
        ]
    });

    return prompt;
}

module.exports = Input;