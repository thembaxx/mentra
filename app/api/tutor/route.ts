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
      topic = 'Quadratic & nature of roots',
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
          ? 'South African SWE & CAPS IT Coding Interviews & Algorithms'
          : track === 'lang'
            ? 'South African Languages (isiZulu & Afrikaans FAL/HL Grammar & Comprehension)'
            : 'South African Grade 12 NSC (CAPS) / IEB STEM & NBT University Entrance (Mathematics & Physical Sciences)';

      const systemPrompt = `You are LearnFlow AI, an expert South African educational question designer for ${trackLabel}.
Generate ONE engaging, rigorous practice question on the topic "${topic}" at "${difficulty}" difficulty, grounded in the South African context (e.g., NSC Paper 1 & 2, IEB, NBT, ZAR currency R, South African cities/names, isiZulu/Afrikaans where appropriate).
IMPORTANT FOR STEM & CODING: Wrap all mathematical expressions, equations, variables, and Big-O complexities in standard LaTeX delimiters ($...$ for inline math and $$...$$ for block equations) so KaTeX renders them cleanly.
Format your output using this exact plain-text template so it streams cleanly to the student:
QUESTION: [Write the clear, self-contained question prompt here in 1-3 sentences with $...$ LaTeX math]
OPTIONS: [Option A] | [Option B] | [Option C] | [Option D]
CORRECT_INDEX: [0, 1, 2, or 3]
HINT: [One concise conceptual hint with $...$ LaTeX without giving away the final answer]
STEPS:
Step 1: [First step of the solution with $...$ or $$...$$ LaTeX]
Step 2: [Second step of the solution with $...$ or $$...$$ LaTeX]
Step 3: [Final step and verification]
VISUALIZATION_JSON: [On ONE line, return null unless the question explicitly includes all numbers required by one of the following safe shapes. Allowed exact JSON only: {"type":"quadratic","a":1,"b":-6,"c":13}; {"type":"linear","slope":4.5,"intercept":18,"variable":"t"}; {"type":"trigonometry","function":"cos","angleDegrees":60}; {"type":"atom","atomicNumber":6}; {"type":"doppler","speedOfSound":340,"sourceSpeed":30,"emittedFrequency":850,"direction":"toward"}. Output the selected shape with ACTUAL question-specific values, not the sample numbers. Do not invent missing coefficients or infer an unknown k. If unrelated coding/languages or numbers are implicit, output null. The JSON is validated against the question by the application.]`;

      if (ai) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.8-flash',
            contents: `Generate a new ${difficulty} practice question about "${topic}" for the ${trackLabel} track using KaTeX ($...$) notation where relevant.`,
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
              'X-Content-Type-Options': 'nosniff',
            },
          });
        } catch {
          // Fall through to deterministic simulated stream if API key is invalid or quota reached
        }
      }

      const synthesized =
        fallbackText ||
        `QUESTION: [${difficulty} · ${topic}] In an NSC Grade 12 STEM problem on "${topic}", a solar battery bank in Cape Town starts at $E_0 = 18\\text{ kWh}$ and charges at a constant rate of $4.5\\text{ kWh}$ per hour. After how many hours $t$ will the stored energy satisfy $E(t) = 18 + 4.5t = 63\\text{ kWh}$?
OPTIONS: $t = 8\\text{ hours}$ | $t = 10\\text{ hours}$ | $t = 12\\text{ hours}$ | $t = 14\\text{ hours}$
CORRECT_INDEX: 1
HINT: Set up the linear equation $18 + 4.5t = 63$ and isolate $t$ by subtracting $E_0 = 18$ from both sides.
STEPS:
Step 1: Formulate the linear state equation: $$18 + 4.5t = 63$$
Step 2: Subtract the initial energy $18$ from both sides: $$4.5t = 45$$
Step 3: Divide by the charging rate $4.5$ to obtain $t = \\frac{45}{4.5} = 10\\text{ hours}$. Verification: $18 + 4.5(10) = 63\\text{ kWh}$.`;

      return new Response(createSimulatedStream(synthesized, 14), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    if (action === 'grade_answer') {
      const systemPrompt = `You are LearnFlow AI Tutor, a warm, rigorous South African NSC/IEB & University STEM/Languages grader.
Evaluate the student's response to the question.
Start your response with "SCORE: X/10" on the very first line (where X is an integer from 1 to 10).
Then provide a concise, specific 2-3 sentence assessment of what the student got right and what to refine, followed by a helpful hint if Score < 10. Use $...$ LaTeX delimiters for any mathematical formulas or variables.`;

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
          ? `You are LearnFlow Pro AI Tutor for South African NSC/IEB & University students. Answer the student's follow-up question clearly and concisely in 3-5 sentences, using $...$ and $$...$$ LaTeX notation for any mathematical expressions.`
          : `You are LearnFlow Pro AI Tutor for South African NSC/IEB & University students. Provide a clear, numbered Step-by-Step explanation (Step 1, Step 2, Step 3, and Verification) using $...$ and $$...$$ LaTeX notation for formulas so the student masters the underlying concept.`;

      const userContent =
        action === 'follow_up'
          ? `Problem: ${questionPrompt}\nStudent's current answer: ${userAnswer || '(none yet)'}\nStudent's follow-up question: ${followUpQuestion}`
          : `Problem (${topic} - ${difficulty}): ${questionPrompt}\nProvide a complete step-by-step breakdown with LaTeX math.`;

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
        `Great question! Looking closely at "${topic}", the key invariant is isolating the primary variable before substituting boundary values. In NSC Paper 1 & 2 marking, writing out the standard formula first guarantees your method mark!`;

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
          ? 'South African Coding Interviews & Algorithms (TypeScript code snippet & Big-O)'
          : track === 'lang'
            ? 'South African Languages: isiZulu & Afrikaans FAL/HL (Grammar pattern & examples)'
            : 'South African Grade 12 NSC / IEB STEM (Mathematics & Physical Sciences formulas in $...$ LaTeX)';

      const systemPrompt = `You are LearnFlow AI, an expert South African educational flashcard creator for ${trackLabel}.
Create ONE high-yield study flashcard on the topic "${topic}" at "${difficulty}" difficulty. Use $...$ and $$...$$ LaTeX notation for any mathematical formulas.
Format your output using this exact plain-text template:
TITLE: [Concise 3-6 word concept title]
PROMPT: [Clear recall question or prompt on the front of the card]
DEFINITION: [Crisp 1-2 sentence definition or core invariant on the back]
SNIPPET:
[4-8 lines of clean code snippet, KaTeX formula derivation, or language example pattern]
TIP: [One memorable NSC exam or interview lifehack]`;

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
$$\\Delta = b^2 - 4ac, \\quad x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$
1. State the official NSC formula for method marks
2. Substitute given values in SI units / ZAR
3. Verify root / boundary conditions
TIP: Always state the formula directly from the NSC information sheet before substituting values.`;

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
