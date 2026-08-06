import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildSystemPrompt } from "@/lib/prompt";
import { getLaws } from "@/lib/stateLaws";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { leaseText, state } = await req.json();

    if (!leaseText || !state) {
      return NextResponse.json(
        { error: "Missing leaseText or state" },
        { status: 400 }
      );
    }

    const laws = getLaws(state);
    const systemPrompt = buildSystemPrompt(state, laws);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analyze this lease:\n\n${leaseText.slice(0, 12000)}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0].message.content ?? "{}";
    const analysis = JSON.parse(raw);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Analysis failed. Check your API key and try again." },
      { status: 500 }
    );
  }
}