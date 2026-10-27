/** Local practice evidence. Undated legacy counters are never treated as study days. */
export type StudyDay = {
  questionIds: string[];
  target: number;
  achieved: boolean;
  counterStart: number;
};

export type StudyActivity = {
  version: 1;
  days: Record<string, StudyDay>;
};

type Clock = number | Date;

export const STUDY_ACTIVITY_KEY = "learnflow-study-activity-v1";

export function emptyStudyActivity(): StudyActivity {
  return { version: 1, days: {} };
}

export function sastStudyDay(now: Clock = Date.now()): string {
  // South Africa uses UTC+02:00 throughout the year.
  return new Date(Number(now) + 2 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function previousDay(day: string): string {
  return new Date(Date.parse(day + "T12:00:00Z") - 86_400_000).toISOString().slice(0, 10);
}

function validDay(day: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(day) &&
    Number.isFinite(Date.parse(day + "T12:00:00Z")) &&
    new Date(day + "T12:00:00Z").toISOString().slice(0, 10) === day
  );
}

function validTarget(target: unknown): target is number {
  return typeof target === "number" && Number.isInteger(target) && target >= 1 && target <= 50;
}

function validId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0 && id.length <= 240;
}

/** Invalid input returns an empty evidence record; it cannot inflate achievements. */
export function parseStudyActivity(raw: string | null): StudyActivity {
  if (!raw || raw.length > 2_000_000) return emptyStudyActivity();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return emptyStudyActivity();
    const record = value as Record<string, unknown>;
    if (
      record.version !== 1 ||
      !record.days ||
      typeof record.days !== "object" ||
      Array.isArray(record.days)
    ) {
      return emptyStudyActivity();
    }
    const days: Record<string, StudyDay> = {};
    for (const [date, rawDay] of Object.entries(record.days)) {
      if (!validDay(date) || !rawDay || typeof rawDay !== "object" || Array.isArray(rawDay))
        continue;
      const day = rawDay as Record<string, unknown>;
      if (
        !Array.isArray(day.questionIds) ||
        day.questionIds.length > 10_000 ||
        !day.questionIds.every(validId) ||
        !validTarget(day.target) ||
        typeof day.achieved !== "boolean"
      )
        continue;
      const ids = [...new Set(day.questionIds)];
      const baseline = day.counterStart ?? 0;
      if (
        typeof baseline !== "number" ||
        !Number.isInteger(baseline) ||
        baseline < 0 ||
        baseline > ids.length
      )
        continue;
      days[date] = {
        questionIds: ids,
        target: day.target,
        achieved: day.achieved && ids.length >= day.target,
        counterStart: baseline,
      };
    }
    return { version: 1, days };
  } catch {
    return emptyStudyActivity();
  }
}

export function studyActivitySummary(activity: StudyActivity, target = 5, now: Clock = Date.now()) {
  const today = sastStudyDay(now);
  const day = activity.days[today];
  let cursor = day?.achieved ? today : previousDay(today);
  let streakDays = 0;
  while (activity.days[cursor]?.achieved) {
    streakDays += 1;
    cursor = previousDay(cursor);
  }
  return {
    today,
    dailyCompleted: day ? day.questionIds.length - day.counterStart : 0,
    totalCompletedToday: day?.questionIds.length ?? 0,
    dailyTarget: validTarget(target) ? target : 5,
    achievedToday: day?.achieved ?? false,
    streakDays,
  };
}

/** Call after a real question attempt completes, using its stable question ID. */
export function recordQuestionCompletion(
  activity: StudyActivity,
  questionId: string,
  target = 5,
  now: Clock = Date.now(),
) {
  if (!validId(questionId) || !validTarget(target))
    throw new RangeError("Invalid practice completion");
  const today = sastStudyDay(now);
  const existing = activity.days[today];
  if (existing?.questionIds.includes(questionId)) {
    return {
      activity,
      newCompletion: false,
      goalJustAchieved: false,
      summary: studyActivitySummary(activity, target, now),
    };
  }
  const questionIds = [...(existing?.questionIds ?? []), questionId];
  const goalJustAchieved = !existing?.achieved && questionIds.length >= target;
  const day: StudyDay = {
    questionIds,
    target: existing?.achieved ? existing.target : target,
    achieved: Boolean(existing?.achieved || goalJustAchieved),
    counterStart: existing?.counterStart ?? 0,
  };
  const updated: StudyActivity = { version: 1, days: { ...activity.days, [today]: day } };
  return {
    activity: updated,
    newCompletion: true,
    goalJustAchieved,
    summary: studyActivitySummary(updated, target, now),
  };
}

/** Reset only the visible counter; retain credited IDs and earned day evidence. */
export function resetTodayCounter(activity: StudyActivity, now: Clock = Date.now()): StudyActivity {
  const today = sastStudyDay(now);
  const day = activity.days[today];
  if (!day) return activity;
  return {
    version: 1,
    days: { ...activity.days, [today]: { ...day, counterStart: day.questionIds.length } },
  };
}
