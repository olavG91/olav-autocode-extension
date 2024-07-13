np# Olav Autocode Extension

This VSCode extension allows users to directly utilize the Anthropic API within VSCode, enabling the enhancement or generation of code snippets based on user inputs.

## Features

- **Prompt Generation**: Input your code or prompts to generate or improve code snippets directly in your active editor.
- **API Integration**: Seamlessly integrates the Anthropic API for real-time code generation and enhancement.
- **Custom Configurations**: Configure your Anthropic API key, model preferences, max tokens, and temperature directly through VSCode settings for personalized use.
- **Quick Commands**: Use `CTRL+SHIFT+K` on Windows, or `CMD+SHIFT+K` on Mac to quickly open Olav Autocode. This can be done with or without selected text.
    - If text is selected, it allows for editing existing code with a prompt.
    - Without text selection, it creates a new code snippet.
    - You can also configure the total number of characters to be used as input for the AI.

## Requirements

- An active Anthropic API key.
- VSCode version 1.75.0 or newer.

## Setup

1. **Install the Extension**: Search for the 'Olav Autocode Extension' in the VSCode Extensions Marketplace and install it.
2. **Configure API Key**: Go to `File > Preferences > Settings > Extensions > Olav Autocode Extension` and set your `anthropic.apiKey`.
3. **Optional Configurations**: Similarly, configure the `model`, `maxTokens`, and `temperature` settings as needed.

## Usage

1. Open any file in VSCode.
2. Highlight a code snippet you want to improve or place the cursor where you want to generate new code.
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) and type `Open Prompt`, then press Enter.
4. Follow the prompt in the input box to generate or improve your code.

## Building from Source

If you wish to build the extension from source:

1. Clone the repository to your local machine.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to bundle the extension using webpack.
4. Use `vsce package` to create a VSIX file that can be installed into VSCode.

## Support

For support or issues with the extension, please file an issue on our GitHub repository.

## Contributing

We welcome contributions! Please refer to our contributing guidelines for detailed information on how you can contribute to the project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
