import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a document classifier. The user will give you text extracted from a document or image. Your ONLY job is to determine if this is a residential lease or rental agreement.

Return ONLY valid JSON:
{
  "isLease": true or false,
  "reason": "one sentence explanation"
}`
        },
        {
          role: "user",
          content: `Is this a lease agreement?\n\n${text.slice(0, 2000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });

    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ isLease: false, reason: "Validation failed." });
  }
}