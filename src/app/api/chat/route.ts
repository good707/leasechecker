import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, clauseText, state } = await req.json();

    const systemPrompt = `You are a tenant-rights legal assistant helping a renter understand a specific clause in their lease for the state of ${state}.

The clause in question is:
"${clauseText}"

Answer questions about this clause clearly and in plain English. Be concise — 2-4 sentences max unless the user asks for more detail. If something is potentially illegal or worth negotiating, say so directly. You are not a lawyer and cannot provide formal legal advice, but you can explain what clauses mean and what options the renter has.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.3,
    });

    const reply = response.choices[0].message.content ?? "";
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Chat failed. Try again." },
      { status: 500 }
    );
  }
}