import fs from "fs/promises";
import path from "path";
import { TestDefinition } from "../models/questions.model";
import { DatabaseDefinition, TestParameters } from "../models/database.model";

let _databaseDefinition: DatabaseDefinition | null = null;
let _isDatabaseInitialized = false;

async function getAvailableTestIds(
    directory: string = "database/test-definitions",
): Promise<string[]> {
    try {
        const dirPath = path.resolve(process.cwd(), directory);

        try {
            await fs.access(dirPath);
        } catch {
            console.warn(`Directory not found: ${dirPath}`);
            return [];
        }

        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        const testNames = entries
            .filter(
                (entry) =>
                    entry.isFile() &&
                    entry.name.toLowerCase().endsWith(".json"),
            )
            .map((entry) => path.basename(entry.name, ".json"));

        return testNames;
    } catch (err) {
        console.error("Failed to read test definitions:", err);
        return [];
    }
}

async function getTestDefinitions(
    testIds: string[],
    directory: string = "database/test-definitions",
): Promise<TestDefinition[]> {
    const results: TestDefinition[] = [];
    const baseDir = path.resolve(process.cwd(), directory);

    if (testIds.length === 0) return results;

    let dirExists = false;
    try {
        await fs.access(baseDir);
        dirExists = true;
    } catch {
        console.warn(`Test definitions directory not found: ${baseDir}`);
    }

    if (!dirExists) return results;

    for (const testId of testIds) {
        const safeId = testId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
        if (!safeId) continue;

        const filePath = path.join(baseDir, `${safeId}.json`);

        try {
            const content = await fs.readFile(filePath, "utf-8");
            const data = JSON.parse(content);

            if (!data || typeof data !== "object") {
                console.warn(`Invalid structure in ${filePath}`);
                continue;
            }

            results.push(data as TestDefinition);
        } catch (err: any) {
            if (err.code === "ENOENT") {
                console.warn(`Test definition not found: ${safeId}.json`);
            } else {
                console.error(`Error loading ${safeId}.json:`, err.message);
            }
        }
    }

    return results;
}

async function buildDatabaseDefinition(
    directory: string = "database/test-definitions",
): Promise<DatabaseDefinition> {
    const testIds = await getAvailableTestIds(directory);
    const testDefinitions = await getTestDefinitions(testIds, directory);

    return testDefinitions.reduce(
        (acc, testDef) => ({
            testIds: [...acc.testIds, testDef.id],
            testParameters: [
                ...acc.testParameters,
                {
                    id: testDef.id,
                    questionsNumber: testDef.singleQuestions?.length || 0,
                    groupsNumber: testDef.questionGroups?.length || 0,
                } as TestParameters,
            ],
        }),
        { testIds: [], testParameters: [] } as DatabaseDefinition,
    );
}

async function getDatabaseDefinition(): Promise<DatabaseDefinition> {
    if (_isDatabaseInitialized) {
        return _databaseDefinition as DatabaseDefinition;
    }

    _databaseDefinition = await buildDatabaseDefinition();
    _isDatabaseInitialized = true;

    return { ..._databaseDefinition } as DatabaseDefinition;
}

export { getDatabaseDefinition, getTestDefinitions };
