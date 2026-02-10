export interface TestParameters {
    id: string;
    questionsNumber: number;
    groupsNumber: number;
}

export interface TestTopic {
    testId: string;
    topicName: string;
    description?: string;
}

export interface DatabaseDefinition {
    topics: TestTopic[];
    testParameters: TestParameters[];
}
