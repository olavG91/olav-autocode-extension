const writeCodeSchema = {
    "name": "write_code",
    "description": "Instruct other AI to write a code snippet",
    "input_schema": {
        "type": "object",
        "properties": {
            "prompt": {
                "type": "string",
                "description": "Short explanation about the project and the task. If there is any information about other files related to this code, it should be included here."
            },
        },
        "required": ["code"]
    }
}

const checkFileSchema = {
    "name": "check_file",
    "description": "Suggest a filename to check for a specific code snippet",
    "input_schema": {
        "type": "object",
        "properties": {
            "file_name": {
                "type": "string",
                "description": "The name of the file to check. E.g. 'component.js'"
            }
        },
        "required": ["file_name"]
    }
}

module.exports = {
    writeCodeSchema,
    checkFileSchema,
};