import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF } from "@/lib/pdfParser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const state = formData.get("state") as string;

    if (!file || !state) {
      return NextResponse.json(
        { error: "Missing file or state" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let leaseText = "";

    if (file.type === "application/pdf") {
      leaseText = await extractTextFromPDF(buffer);
    } else {
      // plain text fallback
      leaseText = buffer.toString("utf-8");
    }

    if (!leaseText || leaseText.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract text from file. Try a text-based PDF." },
        { status: 400 }
      );
    }

    // Forward to analyze
    const analyzeRes = await fetch(new URL("/api/analyze", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaseText, state }),
    });

    const analysis = await analyzeRes.json();
    return NextResponse.json(analysis);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Upload failed. Make sure your PDF is not scanned/image-based." },
      { status: 500 }
    );
  }
}