import type { PracticeQuestion } from "./study-data";

/** Numeric keys must be authored or validated separately, never inferred from text. */
export type AssessableQuestion = Pick<
  PracticeQuestion,
  "options" | "correctOptionIndex" | "hint"
> & {
  numericAnswer?: { value: number };
};

export interface AnswerAssessment {
  status: "correct" | "incorrect" | "self-review";
  score: 10 | 0 | null;
  feedback: string;
  method: "exact-option" | "exact-number" | "self-review";
}

function selfReview(hint: string): AnswerAssessment {
  return {
    status: "self-review",
    score: null,
    feedback:
      "This response has not been graded. Compare your reasoning with the worked explanation." +
      (hint ? ` Hint: ${hint}` : ""),
    method: "self-review",
  };
}

/**
 * Assess only evidence we can check deterministically. A selected option takes
 * precedence over accompanying prose; keywords and answer length earn no marks.
 */
export function assessAnswer(
  question: AssessableQuestion,
  selectedOption: number | null,
  answer: string,
): AnswerAssessment {
  if (selectedOption !== null) {
    const options = question.options;
    const correctIndex = question.correctOptionIndex;
    if (
      !Array.isArray(options) ||
      !Number.isInteger(selectedOption) ||
      selectedOption < 0 ||
      selectedOption >= options.length ||
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return selfReview(question.hint);
    }

    const correct = selectedOption === correctIndex;
    return {
      status: correct ? "correct" : "incorrect",
      score: correct ? 10 : 0,
      feedback: correct
        ? "Your selected answer matches the answer key. Review the worked explanation to check your reasoning."
        : "Your selected answer does not match the answer key." +
          (question.hint ? ` Hint: ${question.hint}` : ""),
      method: "exact-option",
    };
  }

  const expected = question.numericAnswer?.value;
  if (typeof expected !== "number" || !Number.isFinite(expected)) {
    return selfReview(question.hint);
  }

  // One number only. Decimal commas are accepted; statements, expressions,
  // exponents and thousands separators are not silently interpreted as answers.
  const input = answer.trim().replace(/^−/, "-");
  if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(input)) {
    return selfReview(question.hint);
  }
  const value = Number(input.replace(",", "."));
  if (!Number.isFinite(value)) return selfReview(question.hint);

  const correct = value === expected;
  return {
    status: correct ? "correct" : "incorrect",
    score: correct ? 10 : 0,
    feedback: correct
      ? "Your numerical answer matches the answer key. Check your method against the worked explanation."
      : "Your numerical answer does not match the answer key." +
        (question.hint ? ` Hint: ${question.hint}` : ""),
    method: "exact-number",
  };
}
