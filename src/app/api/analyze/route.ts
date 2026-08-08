import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPrompt } from "@/lib/prompt";
import { getLaws } from "@/lib/stateLaws";
import { checkRateLimit } from "@/lib/rateLimit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// gpt-4o-mini's context window comfortably fits far more than the old
// 12,000-character cap, which was silently cutting off longer leases
// (roughly 4-5 pages) with no indication to the user that anything past
// that point — often where indemnification and dispute-resolution clauses
// live — was never analyzed at all.
const MAX_CHARS = 60000;

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkRateLimit(req);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const { leaseText, state } = await req.json();

    if (!leaseText || !state) {
      return NextResponse.json(
        { error: "Missing leaseText or state" },
        { status: 400 }
      );
    }

    const wasTruncated = leaseText.length > MAX_CHARS;
    const textToAnalyze = leaseText.slice(0, MAX_CHARS);

    const laws = getLaws(state);
    const systemPrompt = buildSystemPrompt(state, laws);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this lease:\n\n${textToAnalyze}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0].message.content ?? "{}";
    const analysis = JSON.parse(raw);
    analysis.wasTruncated = wasTruncated;

    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Analysis failed. Check your API key and try again." },
      { status: 500 }
    );
  }
}