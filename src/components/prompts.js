const vscode = require('vscode');
const { getImports } = require('./getFiles');
const base64Image = require('./base64Image');

const Prompts = async ({ editor, startPosition, selectedText }) => {
    const maxInputTokens = vscode.workspace.getConfiguration().get('ai.maxInputTokens');
    const imports = getImports(editor.document.getText());

    const getPreviousCode = (editor, position) => {
        const range = new vscode.Range(new vscode.Position(0, 0), position);
        const text = editor.document.getText(range);
        return text.slice(-Math.floor(maxInputTokens / 2));
    };

    const getSubsequentCode = (editor, position) => {
        const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length));
        const text = editor.document.getText(range);
        return text.slice(0, (maxInputTokens / 2));
    };

    const previousCode = getPreviousCode(editor, startPosition);
    const subsequentCode = getSubsequentCode(editor, editor.selection.end);

    const prompt = `Your task is to write code based on the prompt.

    Here is some information about the project:
    Current file: ${editor.document.fileName}
    Current language: ${editor.document.languageId}
    ${imports.length > 0 ? `Imports and modules: ${JSON.stringify(imports)}` : ''}
    ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
    ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
    
    Only answer with code without any comments or explanations. The code should not have any characters for displaying that it is code.`;

    const promptSelected = `Your task is to change the given code snippet based on the prompt.

    Here is some information about the project:
    Current file: ${editor.document.fileName}
    Current language: ${editor.document.languageId}
    ${imports.length > 0 ? `Imports and modules: ${JSON.stringify(imports)}` : ''}
    ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
    ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
    
    Here is the current code that you should change according to the prompt: ${selectedText}

    Only answer with the changed code without any comments or explanations. The code should be directly usable.`;

    return selectedText ? promptSelected : prompt;
};

const userPrompt = async (prompt) => {
    let userMessage = [{
        role: 'user',
        content: prompt?.image?.url ? [
            {
                type: "image",
                source: {
                    type: "base64",
                    media_type: `image/${prompt.image.format}`,
                    data: await base64Image(prompt.image),
                },
            },
            {
                type: "text",
                text: prompt.content || "Create code based on the image.",
            }
        ] : [
            {
                type: "text",
                text: prompt.content,
            }
        ]
    }];

    return userMessage;
}

module.exports = { Prompts, userPrompt };
