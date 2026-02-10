import * as fs from "fs";
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
            await fs.promises.access(dirPath);
        } catch {
            console.warn(`Directory not found: ${dirPath}`);
            return [];
        }

        const entries = await fs.promises.readdir(dirPath, {
            withFileTypes: true,
        });

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
        await fs.promises.access(baseDir);
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
            const content = await fs.promises.readFile(filePath, "utf-8");
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
            topics: [
                ...acc.topics,
                {
                    testId: testDef.id,
                    topicName: testDef.topic,
                    description: testDef.description,
                },
            ],
            testParameters: [
                ...acc.testParameters,
                {
                    id: testDef.id,
                    questionsNumber: testDef.singleQuestions?.length || 0,
                    groupsNumber: testDef.questionGroups?.length || 0,
                } as TestParameters,
            ],
        }),
        { topics: [], testParameters: [] } as DatabaseDefinition,
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

function getNumberOfGeneratedTests(
    directoryPath: string = "database/generated-tests",
): number {
    try {
        const resolvedPath = path.resolve(directoryPath);

        if (!fs.existsSync(resolvedPath)) {
            console.warn(`Directory does not exist: ${resolvedPath}`);
            return 0;
        }

        const files = fs.readdirSync(resolvedPath);

        const jsonFiles = files.filter(
            (file) => path.extname(file).toLowerCase() === ".json",
        );

        return jsonFiles.length;
    } catch (error) {
        console.error("Error counting JSON files:", error);
        return 0;
    }
}

function saveTestDefinitionToFile(
    testDefinition: TestDefinition,
    directoryPath: string = "database/generated-tests",
): void {
    // Ensure the directory exists
    try {
        // Create directory if it doesn't exist (recursive option creates nested directories)
        fs.mkdirSync(directoryPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory: ${error}`);
        throw error;
    }

    // Construct the full file path
    const filePath = path.join(directoryPath, `${testDefinition.id}.json`);

    try {
        // Write the test definition to the JSON file
        // The null and 2 arguments pretty-print the JSON with 2-space indentation
        fs.writeFileSync(filePath, JSON.stringify(testDefinition, null, 2), {
            encoding: "utf8",
            flag: "w", // 'w' flag means write and overwrite existing file
        });

        console.log(`Test definition file generated: ${filePath}`);
    } catch (error) {
        console.error(`Error writing test definition file: ${error}`);
        throw error;
    }
}

export {
    getDatabaseDefinition,
    getTestDefinitions,
    getNumberOfGeneratedTests,
    saveTestDefinitionToFile,
};
