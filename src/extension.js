const vscode = require('vscode');
const { Anthropic } = require('@anthropic-ai/sdk');
const Prompts = require('./components/prompts');
const { Input, Buttons } = require('./components/input');

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
        let originalContent = editor.document.getText();

        const prompt = await Input(selectedText);

        if (!prompt) return;

        const anthropic = new Anthropic({
            apiKey: apiKey
        });

        let isProcessing = false;
        let queue = [];
        let isComplete = false;

        const processQueue = () => {
            if (queue.length === 0 || isProcessing) {
                if (isComplete && queue.length === 0) {
                    const items = [
                        { label: 'Keep', description: 'Keep the selected code as it is', iconPath: new vscode.ThemeIcon('check') },
                        { label: 'Rerun', description: 'Rerun the prompt', iconPath: new vscode.ThemeIcon('refresh') },
                        { label: 'Reset', description: 'Reset the selected code to its original state', iconPath: new vscode.ThemeIcon('close') },
                    ];
                    vscode.window.showQuickPick(items, {
                        placeHolder: 'Select an action',
                        matchOnDescription: true,
                        matchOnDetail: true,
                        ignoreFocusOut: true,
                    }).then(selection => {
                        if (selection.label === 'Rerun') {
                            if (textActive) {
                                editor.edit(editBuilder => {
                                    editBuilder.replace(new vscode.Range(startPosition, editor.selection.active), selectedText);
                                });
                            } else {
                                editor.edit(editBuilder => {
                                    editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end), originalContent);
                                });
                            }
                            queue = textActive ? [selectedText] : [originalContent];
                            isComplete = false;
                            response();
                        }
                        if (selection.label === 'Reset') {
                            if (textActive) {
                                editor.edit(editBuilder => {
                                    editBuilder.replace(new vscode.Range(startPosition, editor.selection.active), selectedText);
                                });
                            } else {
                                editor.edit(editBuilder => {
                                    editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), editor.document.lineAt(editor.document.lineCount - 1).range.end), originalContent);
                                });
                            }
                        }
                    });
                }
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

        const response = () => {
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
            }).on('end', () => {
                isComplete = true;
                processQueue();
            }).on('error', (error) => {
                console.error('Error interacting with Anthropic AI:', error);
                vscode.window.showErrorMessage('Error interacting with Anthropic AI.' + error);
            });
        }

        response();
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};