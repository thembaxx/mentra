import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest } from 'next/server';

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function createSimulatedStream(text: string, chunkDelayMs = 18): ReadableStream {
  const encoder = new TextEncoder();
  const tokens = text.split(/(\s+)/);
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index >= tokens.length) {
        controller.close();
        return;
      }
      const nextChunk = tokens.slice(index, index + 2).join('');
      index += 2;
      controller.enqueue(encoder.encode(nextChunk));
      await new Promise((r) => setTimeout(r, chunkDelayMs));
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      track = 'exam',
      topic = 'Linear equations',
      difficulty = 'Medium',
      questionPrompt = '',
      userAnswer = '',
      followUpQuestion = '',
      fallbackText = '',
    } = body;

    const ai = getGenAIClient();

    if (action === 'generate_question') {
      const trackLabel =
        track === 'code'
          ? 'Coding Interviews & Algorithms'
          : track === 'lang'
            ? 'Language Learning (Spanish/Grammar/Translation)'
            : 'Standardized Exam Prep (SAT/GRE/Math/Logic)';

      const systemPrompt = `You are LearnFlow AI, an expert educational question designer for ${trackLabel}.
Generate ONE engaging, rigorous practice question on the topic "${topic}" at "${difficulty}" difficulty.
Format your output using this exact plain-text template so it streams cleanly to the student:
QUESTION: [Write the clear, self-contained question prompt here in 1-3 sentences]
OPTIONS: [Option A] | [Option B] | [Option C] | [Option D]
CORRECT_INDEX: [0, 1, 2, or 3]
HINT: [One concise conceptual hint without giving away the final answer]
STEPS:
Step 1: [First step of the solution]
Step 2: [Second step of the solution]
Step 3: [Final step and verification]`;

      if (ai) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: `Generate a new ${difficulty} practice question about "${topic}" for the ${trackLabel} track.`,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of responseStream) {
                  if (chunk.text) {
                    controller.enqueue(encoder.encode(chunk.text));
                  }
                }
                controller.close();
              } catch (streamErr) {
                if (fallbackText) {
                  controller.enqueue(encoder.encode(fallbackText));
                }
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'X-Content-Type-Options': 'nosniff',
            },
          });
        } catch {
          // Fall through to deterministic simulated stream if API key is invalid or quota reached
        }
      }

      const synthesized =
        fallbackText ||
        `QUESTION: [${difficulty} · ${topic}] Suppose a system models "${topic}" where an initial state of 18 units grows by 4.5 units per cycle. After how many cycles n will the output reach 63 units, and what is the invariant relation?
OPTIONS: 8 cycles | 10 cycles | 12 cycles | 14 cycles
CORRECT_INDEX: 1
HINT: Set up the linear relation 18 + 4.5n = 63 and isolate n by subtracting the initial state first.
STEPS:
Step 1: Formulate the state equation: 18 + 4.5n = 63.
Step 2: Subtract the initial value 18 from both sides: 4.5n = 45.
Step 3: Divide by the rate 4.5 to get n = 10 cycles. Verification: 18 + 4.5(10) = 63.`;

      return new Response(createSimulatedStream(synthesized, 14), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    if (action === 'grade_answer') {
      const systemPrompt = `You are LearnFlow AI Tutor, a warm, rigorous, and encouraging academic grader.
Evaluate the student's response to the question.
Start your response with "SCORE: X/10" on the very first line (where X is an integer from 1 to 10).
Then provide a concise, specific 2-3 sentence assessment of what the student got right and what to refine, followed by a helpful hint if Score < 10. Keep it crisp and plain text.`;

      if (ai) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: `Topic: ${topic} (${difficulty})
Question: ${questionPrompt}
Student's Answer: ${userAnswer}`,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of responseStream) {
                  if (chunk.text) {
                    controller.enqueue(encoder.encode(chunk.text));
                  }
                }
                controller.close();
              } catch {
                if (fallbackText) {
                  controller.enqueue(encoder.encode(fallbackText));
                }
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
            },
          });
        } catch {
          // Fall through to local stream
        }
      }

      return new Response(createSimulatedStream(fallbackText, 16), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    if (action === 'explain_steps' || action === 'follow_up') {
      const systemPrompt =
        action === 'follow_up'
          ? `You are LearnFlow Pro AI Tutor. Answer the student's follow-up question clearly and concisely in 3-5 sentences, referencing the current problem.`
          : `You are LearnFlow Pro AI Tutor. Provide a clear, numbered Step-by-Step explanation (Step 1, Step 2, Step 3, and Verification) for the problem so the student masters the underlying concept.`;

      const userContent =
        action === 'follow_up'
          ? `Problem: ${questionPrompt}\nStudent's current answer: ${userAnswer || '(none yet)'}\nStudent's follow-up question: ${followUpQuestion}`
          : `Problem (${topic} - ${difficulty}): ${questionPrompt}\nProvide a complete step-by-step breakdown.`;

      if (ai) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: userContent,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of responseStream) {
                  if (chunk.text) {
                    controller.enqueue(encoder.encode(chunk.text));
                  }
                }
                controller.close();
              } catch {
                if (fallbackText) {
                  controller.enqueue(encoder.encode(fallbackText));
                }
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
            },
          });
        } catch {
          // Fall through
        }
      }

      const defaultFollowUp =
        fallbackText ||
        `Great question! Looking closely at "${topic}", the key invariant is isolating the primary variable before substituting boundary values. Try testing with a small sample input first to verify each transformation step.`;

      return new Response(createSimulatedStream(defaultFollowUp, 15), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    if (action === 'generate_flashcard') {
      const trackLabel =
        track === 'code'
          ? 'Coding Interviews & Algorithms (TypeScript code snippet)'
          : track === 'lang'
            ? 'Spanish & Language Learning (Grammar pattern & conjugated examples)'
            : 'Standardized Exam Prep (Math/Logic formulas & algebraic invariants)';

      const systemPrompt = `You are LearnFlow AI, an expert educational flashcard creator for ${trackLabel}.
Create ONE high-yield study flashcard on the topic "${topic}" at "${difficulty}" difficulty.
Format your output using this exact plain-text template:
TITLE: [Concise 3-6 word concept title]
PROMPT: [Clear recall question or prompt on the front of the card]
DEFINITION: [Crisp 1-2 sentence definition or core invariant on the back]
SNIPPET:
[4-8 lines of clean code snippet, formula derivation, or language example pattern]
TIP: [One memorable exam or interview lifehack]`;

      if (ai) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: `Generate a new ${difficulty} flashcard about "${topic}" for ${trackLabel}.`,
            config: {
              systemInstruction: systemPrompt,
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });

          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of responseStream) {
                  if (chunk.text) {
                    controller.enqueue(encoder.encode(chunk.text));
                  }
                }
                controller.close();
              } catch {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
            },
          });
        } catch {
          // Fall through to simulated stream
        }
      }

      const synthesizedCard = `TITLE: ${topic} Core Invariant
PROMPT: What is the primary invariant and step-by-step pattern for solving ${topic} problems at ${difficulty} level?
DEFINITION: Isolate the governing relationship for ${topic} first, maintaining invariant state across each transformation step.
SNIPPET:
// ${topic} (${difficulty}) Pattern
1. Identify boundary conditions & base state
2. Apply invariant transformation step-by-step
3. Verify complexity & edge cases in O(n)
TIP: Always test ${topic} with minimal boundary inputs (0, 1, or empty state) before generalizing.`;

      return new Response(createSimulatedStream(synthesizedCard, 12), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    return new Response('Unsupported action', { status: 400 });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : 'Streaming error occurred',
      { status: 500 }
    );
  }
}
