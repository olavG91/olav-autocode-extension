const vscode = require('vscode');

const base64Image = (image) => {
    return new Promise((resolve, reject) => {
        vscode.workspace.fs.readFile(vscode.Uri.file(image.url)).then(
            (data) => {
                const base64 = Buffer.from(data).toString('base64');
                resolve(base64);
            },
            (error) => {
                reject(new Error(`Failed to load image: ${error.message}`));
            }
        );
    });
}

module.exports = base64Image;