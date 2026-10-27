import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyStudyActivity,
  parseStudyActivity,
  recordQuestionCompletion,
  resetTodayCounter,
  sastStudyDay,
  studyActivitySummary,
} from "../lib/study-activity.ts";

const clock = (date) => Date.parse(date);
const dayOne = clock("2026-10-24T10:00:00Z");
const dayTwo = clock("2026-10-25T10:00:00Z");
const dayThree = clock("2026-10-26T10:00:00Z");

test("SAST rolls to the next study day at 22:00 UTC", () => {
  assert.equal(sastStudyDay(clock("2026-10-25T21:59:59Z")), "2026-10-25");
  assert.equal(sastStudyDay(clock("2026-10-25T22:00:00Z")), "2026-10-26");
});

test("a question credits once per SAST day and midnight starts a fresh counter", () => {
  const first = recordQuestionCompletion(emptyStudyActivity(), "exam-1", 1, dayOne);
  const repeated = recordQuestionCompletion(first.activity, "exam-1", 1, dayOne);
  assert.equal(first.goalJustAchieved, true);
  assert.equal(repeated.newCompletion, false);
  assert.equal(repeated.goalJustAchieved, false);
  assert.equal(repeated.summary.dailyCompleted, 1);
  assert.equal(studyActivitySummary(first.activity, 1, dayTwo).dailyCompleted, 0);
  const nextDay = recordQuestionCompletion(first.activity, "exam-1", 1, dayTwo);
  assert.equal(nextDay.newCompletion, true);
  assert.equal(nextDay.goalJustAchieved, true);
  assert.equal(nextDay.summary.streakDays, 2);
});

test("goal resets cannot award repeated achievements or duplicate question credit", () => {
  const earned = recordQuestionCompletion(emptyStudyActivity(), "exam-1", 1, dayOne);
  const reset = resetTodayCounter(earned.activity, dayOne);
  assert.equal(studyActivitySummary(reset, 1, dayOne).dailyCompleted, 0);
  assert.equal(studyActivitySummary(reset, 1, dayOne).achievedToday, true);
  const repeated = recordQuestionCompletion(reset, "exam-1", 1, dayOne);
  assert.equal(repeated.summary.dailyCompleted, 0);
  assert.equal(repeated.goalJustAchieved, false);
  const freshQuestion = recordQuestionCompletion(reset, "exam-2", 1, dayOne);
  assert.equal(freshQuestion.summary.dailyCompleted, 1);
  assert.equal(freshQuestion.goalJustAchieved, false);
  assert.equal(freshQuestion.summary.streakDays, 1);
  assert.equal(earned.activity.days["2026-10-24"].counterStart, 0);
});

test("streaks require consecutive achieved dates and a missed day breaks the run", () => {
  const first = recordQuestionCompletion(emptyStudyActivity(), "exam-1", 1, dayOne);
  assert.equal(studyActivitySummary(first.activity, 1, dayTwo).streakDays, 1);
  assert.equal(studyActivitySummary(first.activity, 1, dayThree).streakDays, 0);
  const afterGap = recordQuestionCompletion(first.activity, "exam-2", 1, dayThree);
  assert.equal(afterGap.summary.streakDays, 1);
  assert.equal(Object.keys(afterGap.activity.days).length, 2);
});

test("valid evidence survives serialisation, higher targets and visible resets", () => {
  const first = recordQuestionCompletion(emptyStudyActivity(), "exam-1", 1, dayOne);
  const second = recordQuestionCompletion(first.activity, "exam-2", 5, dayOne);
  const parsed = parseStudyActivity(JSON.stringify(resetTodayCounter(second.activity, dayOne)));
  assert.equal(parsed.days["2026-10-24"].achieved, true);
  assert.equal(parsed.days["2026-10-24"].target, 1);
  assert.equal(studyActivitySummary(parsed, 5, dayOne).dailyCompleted, 0);
  assert.equal(studyActivitySummary(parsed, 5, dayOne).totalCompletedToday, 2);
});

test("malformed JSON and undated legacy counters cannot become study evidence", () => {
  for (const raw of [
    null,
    "{broken",
    "null",
    "[]",
    '{"dailyCompleted":20,"streakDays":50}',
    '{"version":1,"days":[]}',
  ]) {
    assert.deepEqual(parseStudyActivity(raw), emptyStudyActivity());
  }
  const invalid = parseStudyActivity(
    JSON.stringify({
      version: 1,
      days: {
        "2026-02-30": { questionIds: ["a"], target: 1, achieved: true },
        "2026-10-24": { questionIds: ["a", "a"], target: 2, achieved: true },
        "2026-10-25": { questionIds: [1], target: 1, achieved: true },
      },
    }),
  );
  assert.equal(invalid.days["2026-02-30"], undefined);
  assert.equal(invalid.days["2026-10-25"], undefined);
  assert.equal(invalid.days["2026-10-24"].achieved, false);
});

test("invalid completion input is rejected without changing evidence", () => {
  const activity = emptyStudyActivity();
  assert.throws(() => recordQuestionCompletion(activity, "", 1, dayOne), RangeError);
  assert.throws(() => recordQuestionCompletion(activity, "a", 0, dayOne), RangeError);
  assert.deepEqual(activity, emptyStudyActivity());
});
