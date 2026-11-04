import test from "node:test";
import assert from "node:assert/strict";
import { FIGURE_LESSONS } from "../lib/teachable-lessons.ts";

test("each visual model has a complete predict–try–explain lesson", () => {
  assert.equal(Object.keys(FIGURE_LESSONS).length, 9);
  for (const [mode, lesson] of Object.entries(FIGURE_LESSONS)) {
    assert.equal(lesson.choices.length, 2, mode);
    assert.equal(lesson.transferChoices.length, 2, mode);
    assert.notEqual(lesson.choices[0], lesson.choices[1], mode);
    assert.notEqual(lesson.transferChoices[0], lesson.transferChoices[1], mode);
    assert.ok([0, 1].includes(lesson.correct), mode);
    assert.ok([0, 1].includes(lesson.transferCorrect), mode);
    for (const text of [lesson.question, lesson.instruction, lesson.explanation, lesson.transfer])
      assert.ok(text.length > 20, mode);
  }
});
