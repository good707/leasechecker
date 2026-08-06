"use client";

async function getJsPDF() {
  const { default: jsPDF } = await import("jspdf");
  return jsPDF;
}

interface Flag {
  clause_text: string;
  severity: number;
  category: string;
  plain_english: string;
  what_to_do: string;
  illegal_in_state: boolean;
}

interface Analysis {
  fairness_score: number;
  summary: string;
  flags: Flag[];
  positives: string[];
}

const STATE_NAMES: Record<string, string> = {
  CA: "California",
  NY: "New York",
  TX: "Texas",
  FL: "Florida",
  IL: "Illinois",
};

export async function generateReport(data: Analysis, state: string) {
  const jsPDF = await getJsPDF();
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const PAGE_W = 612;
  const PAGE_H = 792;
  const MARGIN = 52;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const FOOTER_H = 40;
  const SAFE_BOTTOM = PAGE_H - FOOTER_H - 20;

  const BLACK   = "#1a1a1a";
  const MUTED   = "#888888";
  const DIM     = "#aaaaaa";
  const RED     = "#c44444";
  const AMBER   = "#b87333";
  const GREEN   = "#4a8a4a";
  const LIGHT   = "#f5f0e8";
  const DIVIDER = "#e0e0e0";
  const BG_DARK = "#1c1c1c";

  function rgb(hex: string): [number, number, number] {
    return [
      parseInt(hex.slice(1,3),16),
      parseInt(hex.slice(3,5),16),
      parseInt(hex.slice(5,7),16),
    ];
  }
  const setColor = (hex: string) => doc.setTextColor(...rgb(hex));
  const setFill  = (hex: string) => doc.setFillColor(...rgb(hex));
  const setDraw  = (hex: string) => doc.setDrawColor(...rgb(hex));

  let y = 0;
  let pageNum = 1;

  function addPage() {
    doc.addPage();
    pageNum++;
    y = MARGIN + 16;
  }

  function checkBreak(needed: number) {
    if (y + needed > SAFE_BOTTOM) addPage();
  }

  function wrap(
    text: string,
    x: number,
    startY: number,
    maxW: number,
    size: number,
    lineH: number,
    font = "helvetica",
    style = "normal"
  ): number {
    doc.setFont(font, style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    lines.forEach((line, i) => doc.text(line, x, startY + i * lineH));
    return startY + lines.length * lineH;
  }

  function estimateWrapH(text: string, maxW: number, size: number, lineH: number): number {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    return lines.length * lineH;
  }

  function divider(gapBefore = 8, gapAfter = 12) {
    y += gapBefore;
    setDraw(DIVIDER);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += gapAfter;
  }

  // ── HEADER ──────────────────────────────────────────
  setFill(BG_DARK);
  doc.rect(0, 0, PAGE_W, 96, "F");

  setColor(LIGHT);
  doc.setFont("times", "normal");
  doc.setFontSize(30);
  doc.text("ClearLease", MARGIN, 48);

  setColor(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Lease Analysis Report", MARGIN, 66);

  const stateName = STATE_NAMES[state] ?? state;
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.text(`${stateName}  ·  ${date}`, PAGE_W - MARGIN, 66, { align: "right" });

  y = 96 + 28;

  // ── SCORE ────────────────────────────────────────────
  const scoreColor = data.fairness_score >= 70 ? GREEN
    : data.fairness_score >= 45 ? AMBER : RED;

  setColor(scoreColor);
  doc.setFont("times", "normal");
  doc.setFontSize(72);
  doc.text(String(data.fairness_score), MARGIN, y + 52);

  setColor(MUTED);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("FAIRNESS SCORE / 100", MARGIN, y + 68);

  // Full-width bar below label
  const barY = y + 78;
  setFill("#e8e8e8");
  doc.roundedRect(MARGIN, barY, CONTENT_W, 5, 2, 2, "F");
  setFill(scoreColor);
  doc.roundedRect(MARGIN, barY, (CONTENT_W * data.fairness_score) / 100, 5, 2, 2, "F");

  y += 100;
  divider(0, 16);

  // ── SUMMARY ──────────────────────────────────────────
  setColor(BLACK);
  y = wrap(data.summary, MARGIN, y, CONTENT_W, 10.5, 16);
  divider(16, 16);

  // ── FLAGS ─────────────────────────────────────────────
  setColor(MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`FLAGGED CLAUSES  (${data.flags?.length ?? 0})`, MARGIN, y);
  y += 18;

  data.flags?.forEach((flag, i) => {
    const sevColor = flag.severity >= 8 ? RED : flag.severity >= 5 ? AMBER : GREEN;
    const textX = MARGIN + 12;
    const textW = CONTENT_W - 12;

    // Estimate block height
    const quoteH  = estimateWrapH(`"${flag.clause_text}"`, textW, 8.5, 13);
    const plainH  = estimateWrapH(flag.plain_english, textW, 10, 15);
    const todoH   = estimateWrapH(flag.what_to_do, textW - 8, 8.5, 13);
    const blockH  = 18 + quoteH + 6 + plainH + 6 + 14 + todoH + 14;
    checkBreak(blockH);

    const blockStartY = y;

    // Severity row
    setColor(sevColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Severity ${flag.severity}/10`, textX, y + 12);

    setColor(MUTED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(flag.category.toUpperCase(), textX + 80, y + 12);

    if (flag.illegal_in_state) {
      setColor(RED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`ILLEGAL IN ${state.toUpperCase()}`, PAGE_W - MARGIN, y + 12, { align: "right" });
    }

    y += 20;

    // Quote
    setColor("#999999");
    y = wrap(`"${flag.clause_text}"`, textX, y, textW, 8.5, 13, "helvetica", "oblique");
    y += 8;

    // Plain English
    setColor(BLACK);
    y = wrap(flag.plain_english, textX, y, textW, 10, 15);
    y += 6;

    // What to do
    setColor(MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("What to do:", textX, y);
    y += 14;
    setColor("#555555");
    doc.setFont("helvetica", "normal");
    y = wrap(flag.what_to_do, textX + 8, y, textW - 8, 8.5, 13);
    y += 14;

    // Left severity bar
    setFill(sevColor);
    doc.rect(MARGIN, blockStartY + 2, 3, y - blockStartY - 10, "F");

    if (i < (data.flags.length - 1)) {
      setDraw(DIVIDER);
      doc.setLineWidth(0.3);
      doc.line(MARGIN + 12, y - 6, PAGE_W - MARGIN, y - 6);
      y += 4;
    }
  });

  divider(12, 16);

  // ── POSITIVES ─────────────────────────────────────────
  checkBreak(30 + (data.positives?.length ?? 0) * 30);

  setColor(MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("WHAT THE LANDLORD GOT RIGHT", MARGIN, y);
  y += 18;

  data.positives?.forEach((p) => {
    const h = estimateWrapH(p, CONTENT_W - 16, 9.5, 14);
    checkBreak(h + 10);

    setColor(GREEN);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("+", MARGIN, y);

    setColor(BLACK);
    y = wrap(p, MARGIN + 16, y, CONTENT_W - 16, 9.5, 14);
    y += 8;
  });

  divider(12, 10);

  // ── FOOTER ────────────────────────────────────────────
  setColor(DIM);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  wrap(
    "This report is generated by ClearLease for informational purposes only and does not constitute legal advice. Consult a licensed attorney for guidance specific to your situation.",
    MARGIN, y, CONTENT_W, 7, 11
  );

  // Page numbers on every page
  const total = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    setColor(DIM);
    doc.setFontSize(7);
    doc.text(`Page ${p} of ${total}`, PAGE_W - MARGIN, PAGE_H - 16, { align: "right" });
    doc.text("clearlease.app", MARGIN, PAGE_H - 16);
  }

  doc.save(`ClearLease_Report_${state}_${Date.now()}.pdf`);
}