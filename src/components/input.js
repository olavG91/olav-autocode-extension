const vscode = require('vscode');

const Input2 = async ({ selectedText }) => {
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

const Input = async ({ selectedText }) => {
    const quickPick = vscode.window.createQuickPick();
    quickPick.items = [
        { label: 'Upload Image', description: 'Upload an image to generate code', iconPath: new vscode.ThemeIcon('file-media') },
    ];
    quickPick.placeholder = selectedText ? '🐿️ Write a prompt to change the selected code.' : '🐿️ Write a prompt to generate code.';
    quickPick.ignoreFocusOut = true;
    quickPick.canSelectMany = false;
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    return new Promise((resolve) => {
        let fileUri;
        let hasCustomInput = false;

        quickPick.onDidChangeValue((value) => {
            if (!fileUri && !hasCustomInput) {
                quickPick.items = [
                    { label: 'Upload Image', description: 'Upload an image to generate code', iconPath: new vscode.ThemeIcon('file-media') },
                ];
            }
            if (value) {
                hasCustomInput = true;
            }
        });

        quickPick.onDidAccept(() => {
            const selectedOption = quickPick.selectedItems[0];
            if (selectedOption) {
                if (selectedOption.label === 'Upload Image') {
                    vscode.window.showOpenDialog({
                        canSelectMany: false,
                        filters: {
                            'Images': ['png', 'jpg', 'jpeg', 'gif']
                        }
                    }).then(uri => {
                        if (uri && uri[0]) {
                            fileUri = uri[0];
                            quickPick.items = [
                                { label: 'Image Uploaded', description: 'Image is embedded in the prompt', iconPath: new vscode.ThemeIcon('check') },
                            ];
                            quickPick.value = '';
                            //Unselect quickpick
                            quickPick.selectedItems = [];
                            hasCustomInput = false;
                            quickPick.show();
                        }
                    });
                } else {
                    quickPick.hide();
                    resolve({
                        image: {
                            url: fileUri?.fsPath,
                            format: fileUri?.fsPath.split('.').pop()
                        }
                    });
                }
            } else {
                const userInput = quickPick.value;
                if (userInput) {
                    quickPick.hide();
                    resolve({
                        image: {
                            url: fileUri?.fsPath,
                            format: fileUri?.fsPath.split('.').pop()
                        },
                        content: userInput
                    });
                }
            }
        });

        quickPick.onDidHide(() => {
            quickPick.dispose();
            resolve(null);
        });

        quickPick.show();
    });
}

module.exports = { Input };