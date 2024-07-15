const vscode = require('vscode');

async function configureSettings() {
    const config = vscode.workspace.getConfiguration('ai');

    const provider = await vscode.window.showQuickPick([
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'OpenAI', value: 'openai' }
    ], {
        placeHolder: 'Select AI provider',
        ignoreFocusOut: true,
    });

    if (!provider) return false;

    const apiKey = await vscode.window.showInputBox({
        placeHolder: `Enter your ${provider.value} API key`,
        prompt: `Get your API key at https://www.${provider.value.toLowerCase()}.com`,
        value: config.get('apiKey', ''),
        validateInput: (value) => {
            if (!value) {
                return 'API key cannot be empty';
            }
            return null;
        },
        ignoreFocusOut: true,
    });

    if (!apiKey) return false;

    let model;
    if (provider.value === 'anthropic') {
        model = await vscode.window.showInputBox({
            placeHolder: 'Enter the Anthropic model (default: claude-3-5-sonnet-20240620)',
            value: config.get('model', 'claude-3-5-sonnet-20240620'),
            validateInput: (value) => {
                if (!value) {
                    return 'Model cannot be empty';
                }
                return null;
            },
            ignoreFocusOut: true,
        });
    } else {
        model = await vscode.window.showInputBox({
            placeHolder: 'Enter the OpenAI model (default: gpt-4o)',
            value: config.get('model', 'gpt-4o'),
            validateInput: (value) => {
                if (!value) {
                    return 'Model cannot be empty';
                }
                return null;
            },
            ignoreFocusOut: true,
        });
    }

    if (!model) return false;

    const maxOutputTokens = await vscode.window.showInputBox({
        placeHolder: 'Enter max output tokens (default: 4096)',
        value: config.get('maxOutputTokens', '4096').toString(),
        validateInput: (value) => {
            if (!value || isNaN(value) || parseInt(value) <= 0) {
                return 'Max output tokens must be a positive number';
            }
            return null;
        },
        ignoreFocusOut: true,
    });

    if (!maxOutputTokens) return false;

    const temperature = await vscode.window.showInputBox({
        placeHolder: 'Enter temperature for code generation (default: 0.5)',
        value: config.get('temperature', '0.5').toString(),
        validateInput: (value) => {
            if (!value || isNaN(value) || parseFloat(value) < 0 || parseFloat(value) > 1) {
                return 'Temperature must be a number between 0 and 1';
            }
            return null;
        },
        ignoreFocusOut: true,
    });

    if (!temperature) return false;

    const maxInputTokens = await vscode.window.showInputBox({
        placeHolder: 'Enter max input tokens (default: 500)',
        value: config.get('maxInputTokens', '500').toString(),
        validateInput: (value) => {
            if (!value || isNaN(value) || parseInt(value) <= 0) {
                return 'Max input tokens must be a positive number';
            }
            return null;
        },
        ignoreFocusOut: true,
    });

    if (!maxInputTokens) return false;

    await vscode.workspace.getConfiguration().update('ai.provider', provider.value, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update('ai.apiKey', apiKey, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update('ai.model', model, vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update('ai.maxOutputTokens', parseInt(maxOutputTokens), vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update('ai.temperature', parseFloat(temperature), vscode.ConfigurationTarget.Global);
    await vscode.workspace.getConfiguration().update('ai.maxInputTokens', parseInt(maxInputTokens), vscode.ConfigurationTarget.Global);

    return true;
}

module.exports = { configureSettings };