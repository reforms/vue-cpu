module.exports = {
    "roots": [
        "./src"
    ],
    "transform": {
        "^.+\\.tsx?$": "ts-jest"
    },
    "testMatch": ['**/?(*.)+(spec|test).[jt]s?(x)'],
    "globals": {
        "ts-jest": {
            "tsConfig": "tsconfig.test.json",
            "diagnostics": {
                "ignoreCodes": [151001]
            }
        }
    },
    "moduleDirectories": ['node_modules', 'src/ts'],
    "moduleFileExtensions": ["js", "ts"]
}