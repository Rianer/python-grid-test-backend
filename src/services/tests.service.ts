import * as fs from "fs";
import * as path from "path";
import { TestDefinition } from "../models/questions.model";
import { getDatabaseDefinition } from "./database.service";
import { log } from "console";

function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
}

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

async function generateNewTest() {
    const dbDef = await getDatabaseDefinition();
    const selected_tests: string[] = [];

    for (let iterator = 0; iterator < 3; iterator++) {
        let isValidTest = false;
        while (!isValidTest) {
            const testIndex = getRandomInt(dbDef.testIds.length);
            isValidTest = !selected_tests.some(
                (testId) => testId === dbDef.testIds[testIndex],
            );
            if (isValidTest) {
                selected_tests.push(dbDef.testIds[testIndex]);
            }
        }
    }

    log(selected_tests);
}

export { readTestDefinition, generateNewTest };
