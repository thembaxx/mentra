import { NextRequest, NextResponse } from "next/server";
import { resolveQuestionVisualization, validateVisualization } from "@/lib/visualization-schema";

/** A small deterministic validation boundary; no arbitrary AI code, HTML or SVG. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const data = body as Record<string, unknown>;
  if (
    data.track !== "exam" ||
    typeof data.question !== "string" ||
    data.question.length > 12000 ||
    !data.question.trim()
  ) {
    return NextResponse.json({ error: "Invalid exam question" }, { status: 400 });
  }
  // Reject unusually large generated payloads before validating each key.
  if (data.candidate !== undefined && JSON.stringify(data.candidate)?.length > 1000) {
    return NextResponse.json({ error: "Visualization payload too large" }, { status: 400 });
  }
  const supplied = validateVisualization(data.candidate);
  const visualization = resolveQuestionVisualization(data.question, supplied);
  return NextResponse.json(
    {
      visualization,
      exact: visualization !== null,
      reason: visualization ? "question-grounded" : "no-matching-numeric-model",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
