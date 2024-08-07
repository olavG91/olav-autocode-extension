const vscode = require('vscode');
const { configureSettings } = require('./components/settings');
const { Anthropic } = require('@anthropic-ai/sdk');
const { Prompts, userPrompt } = require('./components/prompts');
const { Input } = require('./components/input');

async function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.openPrompt', async () => {
        const apiKey = vscode.workspace.getConfiguration().get('ai.apiKey');
        const model = vscode.workspace.getConfiguration().get('ai.model');
        const maxOutputTokens = vscode.workspace.getConfiguration().get('ai.maxOutputTokens');
        const temperature = vscode.workspace.getConfiguration().get('ai.temperature');

        if (!apiKey || !model || !maxOutputTokens || !temperature) {
            const configured = await configureSettings();
            if (!configured) {
                vscode.window.showErrorMessage('Configuration is not complete. Please try again or configure the extension settings manually.');
                return;
            }
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        let selection = editor.selection;
        let selectedText = editor.document.getText(selection);
        let startPosition = selection.isEmpty ? editor.selection.active : selection.start;
        let textActive = !selection.isEmpty;
        let originalContent = editor.document.getText();
        let lastGeneratedRange = null;

        const prompt = await Input(selectedText);
        if (!prompt) return;

        let getUserPrompt = await userPrompt(prompt);

        const anthropic = new Anthropic({ apiKey });

        let isProcessing = false;
        let queue = [];
        let isComplete = false;
        let newTextLength = 0;

        const processQueue = async () => {
            if (queue.length === 0 || isProcessing) {
                if (isComplete && queue.length === 0) {
                    if (textActive) {
                        const endPosition = editor.document.positionAt(editor.document.offsetAt(startPosition) + newTextLength);
                        lastGeneratedRange = new vscode.Range(startPosition, endPosition);
                        editor.selection = new vscode.Selection(startPosition, endPosition);
                    }

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

                    if (option) {
                        if (option.label === 'Rerun') {
                            await rerun();
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
                newTextLength += newText.length;
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
                    if (lastGeneratedRange) {
                        editBuilder.replace(lastGeneratedRange, selectedText);
                    } else {
                        const fullRange = new vscode.Range(
                            editor.document.positionAt(0),
                            editor.document.positionAt(editor.document.getText().length)
                        );
                        editBuilder.replace(fullRange, originalContent);
                    }
                });
                editor.selection = new vscode.Selection(startPosition, startPosition);
                lastGeneratedRange = null;
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to reset content: ${error}`);
            }
        };

        const rerun = async () => {
            if (lastGeneratedRange) {
                await editor.edit(editBuilder => {
                    editBuilder.delete(lastGeneratedRange);
                });
                startPosition = lastGeneratedRange.start;
                editor.selection = new vscode.Selection(startPosition, startPosition);
            } else {
                await resetContent();
            }
            textActive = true;
            newTextLength = 0;
            isComplete = false;
            queue = [];
            await response(getUserPrompt);
        };

        const systemPrompt = await Prompts({ editor, startPosition, selectedText });

        const response = async (messages) => {
            try {
                newTextLength = 0;
                const stream = await anthropic.messages.stream({
                    system: systemPrompt,
                    messages: messages,
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

        await response(getUserPrompt);
    });

    context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate,
};