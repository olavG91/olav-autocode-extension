const vscode = require('vscode');
const { Anthropic } = require('@anthropic-ai/sdk');
const Prompts = require('./components/prompts');
const Input = require('./components/input');

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

        const prompt = await Input(selectedText);
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

        const systemPrompt = Prompts({ editor, startPosition, selectedText });

        const model = vscode.workspace.getConfiguration().get('anthropic.model');
        const maxOutputTokens = vscode.workspace.getConfiguration().get('anthropic.maxOutputTokens');
        const temperature = vscode.workspace.getConfiguration().get('anthropic.temperature');

        anthropic.messages.stream({
            system: systemPrompt,
            messages: [
                { role: 'user', content: prompt }
            ],
            model: model,
            max_tokens: maxOutputTokens,
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
