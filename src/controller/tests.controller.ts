import * as fs from "fs";
import * as path from "path";
import { TestDefinition } from "../models/questions.model";

function readTestDefinition(testId: string): TestDefinition | null {
    const filePath = path.join(
        __dirname,
        "../../database/test-definitions",
        `${testId}.json`,
    );

    try {
        const fileContents = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContents);
        return jsonData;
    } catch (error: any) {
        console.error(`Error reading file: ${error.message}`);
        return null;
    }
}

export { readTestDefinition };
