export interface AnswerVariant {
    id: string;
    value: string;
}

export interface BaseQuestion {
    title: string;
    answerVariants: AnswerVariant[];
    correctAnswerIds: string;
    explanation?: string;
}

export interface QuestionGroup {
    groupTitle: string;
    questions: BaseQuestion[];
}

export interface TestDefinition {
    id: string;
    topic: string;
    description?: string;
    singleQuestions: BaseQuestion[];
    questionGroups: QuestionGroup[];
}
