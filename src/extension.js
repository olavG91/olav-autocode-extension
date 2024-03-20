const vscode = require('vscode');
const { Anthropic } = require('@anthropic-ai/sdk');

async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.openPrompt', async () => {
        const apiKey = vscode.workspace.getConfiguration().get('anthropic.apiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('Anthropic API key is not configured.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        let startPosition = selection.isEmpty ? editor.selection.active : selection.start;
        let textActive = selectedText ? true : false;

        const prompt = await vscode.window.showInputBox({
            prompt: selectedText ? 'Enter your prompt to change the selected code' : 'Enter your prompt',
            placeHolder: selectedText ? 'Write a prompt to change the selected code.' : 'Write a prompt to generate code.',
            validateInput: (value) => {
                if (!value) {
                    return 'Prompt cannot be empty';
                }
                return null;
            },
        });

        if (!prompt) return;

        const anthropic = new Anthropic({
            apiKey: apiKey
        });

        let isProcessing = false;
        let queue = [];

        const processQueue = () => {
            if (queue.length === 0 || isProcessing) {
                return;
            }
            isProcessing = true;
            const newText = queue.shift();

            editor.edit(editBuilder => {
                if (textActive) {
                    editBuilder.delete(selection);
                    textActive = false;
                    console.log("Deleting text");
                }
                const currentPosition = editor.selection.start;
                editBuilder.insert(currentPosition, newText);
            }).then(success => {
                isProcessing = false;
                if (!success) {
                    vscode.window.showErrorMessage('Failed to insert text.' + success);
                } else {
                    editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.start);
                    }).then(success => {
                        if (!success) {
                            vscode.window.showErrorMessage('Failed to insert text.' + success);
                        }
                        processQueue();
                    });
                }
            });
        };

        const getPreviousCode = (editor, position) => {
            const range = new vscode.Range(new vscode.Position(0, 0), position);
            const text = editor.document.getText(range);
            return text.slice(Math.max(text.length - 500, 0));
        };

        const getSubsequentCode = (editor, position) => {
            const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount, 0));
            const text = editor.document.getText(range);
            return text.slice(0, 500);
        };

        const previousCode = getPreviousCode(editor, startPosition);
        const subsequentCode = getSubsequentCode(editor, startPosition);

        const systemPrompt = selectedText
            ? `Your task is to change the given code snippet based on the prompt.

            Here is some information about the project:
            Current file: ${editor.document.fileName}
            Current language: ${editor.document.languageId}
            ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
            ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
            
            Here is the current code that you should change according to the prompt: ${selectedText}

            Only answer with the changed code without any comments or explanations. The code should be directly usable.`
            : `Your task is to write code based on the prompt.

            Here is some information about the project:
            Current file: ${editor.document.fileName}
            Current language: ${editor.document.languageId}
            ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
            ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
            
            Only answer with code without any comments or explanations. The code should not have any characters for displaying that it is code.`;

        const model = vscode.workspace.getConfiguration().get('anthropic.model');
        const maxTokens = vscode.workspace.getConfiguration().get('anthropic.maxTokens');
        const temperature = vscode.workspace.getConfiguration().get('anthropic.temperature');

        anthropic.messages.stream({
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
            model: model,
            max_tokens: maxTokens,
            temperature: temperature,
        }).on('text', (text) => {
            if (text) {
                queue.push(text);
                processQueue();
            }
        }).on('error', (error) => {
            console.error('Error interacting with Anthropic AI:', error);
            vscode.window.showErrorMessage('Error interacting with Anthropic AI.');
        });
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};
