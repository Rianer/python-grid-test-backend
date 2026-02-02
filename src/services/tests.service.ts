import * as fs from "fs";
import * as path from "path";
import {
    BaseQuestion,
    QuestionGroup,
    TestDefinition,
} from "../models/questions.model";
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

function calculateQuestionSelectionRange(tests: TestDefinition[]) {
    let minSingleQuestionsCount = 99;
    let minQuestionGroupsCount = 99;
    let totalSingleQuestions = 0;
    let totalQuestionGroups = 0;

    tests.forEach((test) => {
        const singleQuestionsLen = test.singleQuestions.length;
        const questionsGroupsLen = test.questionGroups.length;
        if (singleQuestionsLen < minSingleQuestionsCount) {
            minSingleQuestionsCount = singleQuestionsLen;
        }
        if (questionsGroupsLen < minQuestionGroupsCount) {
            minQuestionGroupsCount = questionsGroupsLen;
        }

        totalSingleQuestions += singleQuestionsLen;
        totalQuestionGroups += questionsGroupsLen;
    });

    return {
        minSingleQuestionsCount,
        minQuestionGroupsCount,
        totalSingleQuestions,
        totalQuestionGroups,
        maxSingleQuestions: minSingleQuestionsCount * tests.length,
        maxQuestionGroups: minQuestionGroupsCount * tests.length,
    };
}

function pickRandomQuestions(
    test: TestDefinition,
    sQuestions: number,
    qGroups: number,
) {
    sQuestions =
        sQuestions <= test.singleQuestions.length
            ? sQuestions
            : test.singleQuestions.length;
    qGroups =
        qGroups <= test.questionGroups.length
            ? qGroups
            : test.questionGroups.length;

    const testCopy = { ...test } as TestDefinition;

    const selectedQuestions: BaseQuestion[] = [];
    const selectedGroups: QuestionGroup[] = [];

    for (let iteration = 0; iteration < sQuestions; iteration++) {
        const selectionIndex = getRandomInt(testCopy.singleQuestions.length);
        selectedQuestions.push(
            testCopy.singleQuestions.splice(selectionIndex, 1)[0],
        );
    }

    for (let iteration = 0; iteration < sQuestions; iteration++) {
        const selectionIndex = getRandomInt(testCopy.questionGroups.length);
        selectedGroups.push(
            testCopy.questionGroups.splice(selectionIndex, 1)[0],
        );
    }

    return { selectedQuestions, selectedGroups };
}

async function readTestFile(
    testId: string,
    testsDirectory = "database/test-definitions",
): Promise<TestDefinition> {
    try {
        const filePath = path.join(testsDirectory, `${testId}.json`);
        const fileContents = await fs.promises.readFile(filePath, "utf-8");

        return JSON.parse(fileContents) as TestDefinition;
    } catch (error) {
        if (error instanceof Error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                // File not found
                throw new Error(
                    `Test definition file for testId ${testId} not found`,
                );
            }

            // JSON parsing error
            if (error instanceof SyntaxError) {
                throw new Error(
                    `Invalid JSON in test definition file for testId ${testId}`,
                );
            }
        }

        throw error;
    }
}

async function generateNewTest() {
    const dbDef = await getDatabaseDefinition();
    const selectedTestIds: string[] = [];

    for (let iterator = 0; iterator < 3; iterator++) {
        let isValidTest = false;
        while (!isValidTest) {
            const testIndex = getRandomInt(dbDef.testIds.length);
            isValidTest = !selectedTestIds.some(
                (testId) => testId === dbDef.testIds[testIndex],
            );
            if (isValidTest) {
                selectedTestIds.push(dbDef.testIds[testIndex]);
            }
        }
    }

    const selectedTests = await Promise.all(
        selectedTestIds.map((testId) => readTestFile(testId)),
    );

    const generationRanges = calculateQuestionSelectionRange(selectedTests);

    // RNG Logic
    const hasBiasToMoreGroups = !!getRandomInt(2);
    const maxSQuestions = hasBiasToMoreGroups
        ? Math.floor(0.7 * generationRanges.maxSingleQuestions)
        : Math.floor(0.9 * generationRanges.maxSingleQuestions);
    const maxQGroups = hasBiasToMoreGroups
        ? Math.floor(0.9 * generationRanges.maxQuestionGroups)
        : Math.floor(0.7 * generationRanges.maxQuestionGroups);

    // Use the pickRandomQuestions method to select random number of questions from each test
}

export { readTestDefinition, generateNewTest };
