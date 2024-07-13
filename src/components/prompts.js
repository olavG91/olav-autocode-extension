const vscode = require('vscode');

const Prompts = ({ editor, startPosition, selectedText }) => {
    const maxInputTokens = vscode.workspace.getConfiguration().get('anthropic.maxInputTokens');

    const getPreviousCode = (editor, position) => {
        const range = new vscode.Range(new vscode.Position(0, 0), position);
        const text = editor.document.getText(range);
        return text.slice(Math.max(text.length - (maxInputTokens / 2), 0));
    };

    const getSubsequentCode = (editor, position) => {
        const range = new vscode.Range(position, new vscode.Position(editor.document.lineCount, 0));
        const text = editor.document.getText(range);
        return text.slice(0, (maxInputTokens / 2));
    };

    const previousCode = getPreviousCode(editor, startPosition);
    const subsequentCode = getSubsequentCode(editor, startPosition);

    const prompt = `Your task is to write code based on the prompt.

    Here is some information about the project:
    Current file: ${editor.document.fileName}
    Current language: ${editor.document.languageId}
    ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
    ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
    
    Only answer with code without any comments or explanations. The code should not have any characters for displaying that it is code.`;

    const promptSelected = `Your task is to change the given code snippet based on the prompt.

        Here is some information about the project:
        Current file: ${editor.document.fileName}
        Current language: ${editor.document.languageId}
        ${previousCode ? `Here is some code from the document before cursor position: ${previousCode}` : ''}
        ${subsequentCode ? `Here is some code from the document after cursor position: ${subsequentCode}` : ''}
        
        Here is the current code that you should change according to the prompt: ${selectedText}

        Only answer with the changed code without any comments or explanations. The code should be directly usable.`;

    return selectedText ? promptSelected : prompt;
};

module.exports = Prompts;