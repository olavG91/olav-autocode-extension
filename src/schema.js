const writeCodeSchema = {
    "name": "write_code",
    "description": "Write code based on the given instructions",
    "input_schema": {
        "type": "object",
        "properties": {
            "code": {
                "type": "string",
                "description": "The code to write"
            },
        },
        "required": ["code"]
    }
}

const checkFileSchema = {
    "name": "check_file",
    "description": "Check contents in a file to get better response",
    "input_schema": {
        "type": "object",
        "properties": {
            "file_path": {
                "type": "string",
                "description": "The name of the file to check"
            },
        },
        "required": ["file_path"]
    }
}

module.exports = {
    writeCodeSchema,
    checkFileSchema,
};