export interface TestParameters {
    id: string;
    questionsNumber: number;
    groupsNumber: number;
}

export interface DatabaseDefinition {
    testIds: string[];
    testParameters: TestParameters[];
}
