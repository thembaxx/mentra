import test from "node:test";
import assert from "node:assert/strict";
import { assessAnswer } from "../lib/answer-assessment.ts";

const question = {
  hint: "Find the turning point, then check the discriminant.",
  options: ["k = 9", "k = 13", "k = 15", "k = -5"],
  correctOptionIndex: 1,
  okKeywords: ["13", "non-real"],
  partialKeywords: ["turning point"],
};

test("a negated keyword and long unsupported reasoning remain ungraded", () => {
  for (const answer of [
    "k is not 13",
    "This is a long incorrect answer with no mathematical evidence whatsoever.",
    "I think the turning point gives k = 15, not 13.",
    "13",
  ]) {
    const result = assessAnswer(question, null, answer);
    assert.equal(result.score, null);
    assert.equal(result.status, "self-review");
    assert.match(result.feedback, /not been graded/);
  }
});

test("multiple-choice grading uses the selected option, not accompanying prose", () => {
  assert.equal(assessAnswer(question, 1, "").score, 10);
  assert.equal(assessAnswer(question, 0, "The answer is k = 13").score, 0);
  assert.equal(assessAnswer(question, 2, "non-real 13 turning point").status, "incorrect");
  assert.equal(assessAnswer(question, 1, "I was unsure").method, "exact-option");
});

test("an invalid selected option or answer key cannot be graded", () => {
  for (const selected of [-1, 4, 0.5, NaN, Infinity]) {
    assert.equal(assessAnswer(question, selected, "13").score, null);
  }
  for (const correctOptionIndex of [undefined, -1, 4, 1.5, NaN]) {
    assert.equal(assessAnswer({ ...question, correctOptionIndex }, 1, "13").score, null);
  }
  assert.equal(assessAnswer({ hint: "" }, 1, "13").score, null);
});

test("only an explicit finite numerical answer key enables numeric grading", () => {
  const numeric = { hint: "Check the subtraction.", numericAnswer: { value: 13 } };
  for (const answer of ["13", "13.0", "13,00", "+13", " 13 "]) {
    assert.equal(assessAnswer(numeric, null, answer).score, 10);
  }
  assert.equal(assessAnswer(numeric, null, "14").score, 0);
  assert.equal(assessAnswer(numeric, null, "13.00001").score, 0);
  assert.equal(assessAnswer(numeric, null, "13").method, "exact-number");
  assert.equal(assessAnswer({ hint: "", numericAnswer: { value: NaN } }, null, "13").score, null);
  assert.equal(
    assessAnswer({ hint: "", numericAnswer: { value: Infinity } }, null, "Infinity").score,
    null,
  );
});

test("numeric grading does not accept negation, expressions or trailing text", () => {
  const numeric = { hint: "", numericAnswer: { value: 13 } };
  for (const answer of [
    "",
    "not 13",
    "k = 13",
    "13 + 0",
    "1.3e1",
    "13 cats",
    "Infinity",
    "13,000.00",
  ]) {
    assert.equal(assessAnswer(numeric, null, answer).score, null, answer);
  }
  assert.equal(assessAnswer({ hint: "", numericAnswer: { value: -0.5 } }, null, "−0,5").score, 10);
});

test("a numeric key never overrides a selected wrong multiple-choice answer", () => {
  const mixed = { ...question, numericAnswer: { value: 13 } };
  assert.equal(assessAnswer(mixed, 0, "13").score, 0);
});
