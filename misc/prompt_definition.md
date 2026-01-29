# Quiz / Automated Test JSON Format

This JSON file defines a self-contained quiz or automated test suite, typically focused on a single Python programming topic (e.g. "Data Types", "Functions", "OOP", etc.).
The quiz is targeted towards learning students that are on beginner-intermediate levels of understanding.

## Root Structure

```json
{
  "id":               string,           // Unique short identifier of the test (don't include the name Python in the id)
                                        // Examples: "data-types", "list-comprehensions", "sql-basics"
                                        // Used for file name, routing, or referencing

  "topic":            string,           // Human-readable title of the quiz
                                        // Examples: "Python Data Types", "Advanced List Operations"

  "description":      string,           // 1–3 sentence explanation of what the test covers
                                        // Shown to the user before starting

  "singleQuestions":  array of Question, // Optional – standalone questions
                                        // Usually single-correct-answer style

  "questionGroups":   array of Group     // Optional – blocks of related questions
                                        // Often used for "choose all that apply" or themed sets
}
```

## Question Object
(Used in both singleQuestions and inside questionGroups.questions)

```json
{
  "title":            string,           // The question text
                                        // Supports markdown and code blocks:
                                        // - `inline code`
                                        // - ```python

  "answerVariants":   array of {
    "id":     string,                   // Short unique key per option
                                        // Convention: "a", "b", "c", ..., "f", "g", ...
    "value":  string                    // Displayed answer text
                                        // Can contain code, math, quotes, etc.
  },

  "correctAnswerIds": array of string,  // IDs of all correct options
                                        // • Exactly 1 item  → single-choice question
                                        // • 2 or more items → multi-select ("choose all that apply")

  "explanation":      string            // Detailed explanation shown after answering
                                        // Should explain why correct answers are right
                                        // and why others are wrong
                                        // Supports markdown & code blocks
}
```

## Group Object
(Items inside the questionGroups array)

```json
{
  "groupTitle": string,                 // Instruction / heading shown above the whole group
                                        // Examples:
                                        // "Choose all correct answers."
                                        // "What is the final value of `x` after each snippet?"
                                        // "Select every true statement about lists and tuples."

  "questions":  array of Question       // 3–8 questions that belong to this thematic block
}
```
## Conventions & Best Practices

- Use lowercase letters a–z for answer id values (avoid numbers or special chars)
- Keep title concise but clear (ideally 80–140 characters)
- Use triple-backtick code blocks in title and explanation for Python snippets
- Single-choice questions → exactly 1 id in correctAnswerIds
- Multi-select questions → 2 or more ids in correctAnswerIds
- Explanations should be educational — teach the concept, don’t just say "b is correct"
- Questions may contain valid, runnable Python code snippets
- The format is topic-agnostic (can be used for Python, JavaScript, SQL, Git, algorithms, etc.)

## Purpose

These JSON files are used to automatically render interactive programming quizzes / tests in a web application.

### They support:
- Single-choice questions
- Multi-select ("choose all that apply") questions
- Code-output-prediction questions
- "What happens after this snippet?" questions
- Themed question blocks with shared instructions
