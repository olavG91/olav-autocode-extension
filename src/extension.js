const vscode = require('vscode');
const { Anthropic } = require('@anthropic-ai/sdk');
const Prompts = require('./components/prompts');
const { Input } = require('./components/input');

async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.openPrompt', async () => {
        const apiKey = vscode.workspace.getConfiguration().get('anthropic.apiKey');
        if (!apiKey) {
            vscode.window.showErrorMessage('Anthropic API key is not configured.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        let selection = editor.selection;
        let selectedText = editor.document.getText(selection);
        let startPosition = selection.isEmpty ? editor.selection.active : selection.start;
        let textActive = !selection.isEmpty;
        let originalContent = editor.document.getText();

        const prompt = await Input(selectedText);
        if (!prompt) return;

        const anthropic = new Anthropic({ apiKey });

        let isProcessing = false;
        let queue = [];
        let isComplete = false;

        const processQueue = async () => {
            if (queue.length === 0 || isProcessing) {
                if (isComplete && queue.length === 0) {
                    const items = [
                        { label: 'Keep', description: 'Keep the current code', iconPath: new vscode.ThemeIcon('check') },
                        { label: 'Rerun', description: 'Rerun the prompt', iconPath: new vscode.ThemeIcon('refresh') },
                        { label: 'Reset', description: 'Reset to original state', iconPath: new vscode.ThemeIcon('close') },
                    ];
                    const option = await vscode.window.showQuickPick(items, {
                        placeHolder: 'Select an action',
                        matchOnDescription: true,
                        matchOnDetail: true,
                        ignoreFocusOut: true,
                    });

                    if (selection) {
                        if (option.label === 'Rerun') {
                            vscode.window.showInformationMessage('Selected text: ' + selectedText);
                            await resetContent();
                            await response();
                        } else if (option.label === 'Reset') {
                            await resetContent();
                        }
                    }
                }
                return;
            }

            isProcessing = true;
            const newText = queue.shift();

            try {
                await editor.edit(editBuilder => {
                    if (textActive) {
                        editBuilder.delete(selection);
                        textActive = false;
                    }
                    const currentPosition = editor.selection.start;
                    editBuilder.insert(currentPosition, newText);
                });
                isProcessing = false;
                processQueue();
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to insert text: ${error}`);
                isProcessing = false;
            }
        };

        const resetContent = async () => {
            try {
                await editor.edit(editBuilder => {
                    if (textActive) {
                        editBuilder.replace(new vscode.Range(startPosition, editor.selection.active), selectedText);
                    } else {
                        const fullRange = new vscode.Range(
                            editor.document.positionAt(0),
                            editor.document.positionAt(editor.document.getText().length)
                        );
                        editBuilder.replace(fullRange, originalContent);
                    }
                });
                editor.selection = new vscode.Selection(startPosition, startPosition);
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reset content: ${error}`);
            }
        };

        const systemPrompt = Prompts({ editor, startPosition, selectedText });

        const model = vscode.workspace.getConfiguration().get('anthropic.model');
        const maxOutputTokens = vscode.workspace.getConfiguration().get('anthropic.maxOutputTokens');
        const temperature = vscode.workspace.getConfiguration().get('anthropic.temperature');

        const response = async () => {
            try {
                const stream = await anthropic.messages.stream({
                    system: systemPrompt,
                    messages: [{ role: 'user', content: prompt }],
                    model,
                    max_tokens: maxOutputTokens,
                    temperature,
                });

                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                        queue.push(chunk.delta.text);
                        processQueue();
                    }
                }

                isComplete = true;
                processQueue();
            } catch (error) {
                console.error('Error interacting with Anthropic AI:', error);
                vscode.window.showErrorMessage(`Error interacting with Anthropic AI: ${error}`);
            }
        };

        await response();
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};