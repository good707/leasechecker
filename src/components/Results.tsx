
"use client";
import ClauseChat from "./ClauseChat";

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

interface Props {
  data: Analysis;
  state: string;
}

function flagBorder(s: number) {
  if (s >= 8) return "border-l-2 border-l-[#7a2020]";
  if (s >= 5) return "border-l-2 border-l-[#7a5a20]";
  return "border-l-2 border-l-[#1a3a1a]";
}

function severityBadge(s: number) {
  if (s >= 8) return "bg-[#1e0f0f] text-[#c44]";
  if (s >= 5) return "bg-[#1e170f] text-[#b87333]";
  return "bg-[#0f1e0f] text-[#4a8a4a]";
}

function scoreColor(score: number) {
  if (score >= 70) return "text-[#4a8a4a]";
  if (score >= 45) return "text-[#c8a96e]";
  return "text-[#c44]";
}

export default function Results({ data, state }: Props) {
  return (
    <div className="flex flex-col gap-8">
      {/* Download button */}
<div className="flex justify-end">
  <button
  onClick={async () => {
  const { generateReport } = await import("@/lib/generateReport");
  await generateReport(data, state);
}}
  className="text-xs font-medium px-4 py-2 rounded-lg bg-[#1c1c1c] border border-[#282828] text-[#888] hover:text-[#f5f0e8] hover:border-[#444] transition-all"
>
  ↓ Download Report
</button>
</div>

      {/* Score */}
      <div className="text-center pt-2">
        <div
          style={{ fontFamily: "'Playfair Display', serif" }}
          className={`text-8xl font-medium leading-none ${scoreColor(data.fairness_score)}`}
        >
          {data.fairness_score}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-[#333] mt-3">
          Fairness Score
        </div>
        <p className="text-sm text-[#555] mt-4 max-w-lg mx-auto leading-relaxed">
          {data.summary}
        </p>
      </div>

      <div className="h-px bg-[#242424]" />

      {/* Flags */}
      {data.flags?.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#444]">
            ⚠ Flagged clauses ({data.flags.length})
          </div>
          {data.flags.map((flag, i) => (
            <div
              key={i}
              className={`bg-[#1c1c1c] border border-[#282828] rounded-xl p-5 flex flex-col gap-3 ${flagBorder(flag.severity)}`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${severityBadge(flag.severity)}`}>
                  Severity {flag.severity}/10
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#3a3a3a]">
                  {flag.category}
                </span>
                {flag.illegal_in_state && (
                  <span className="text-[10px] font-medium bg-[#1e0f0f] text-[#c44] px-2.5 py-1 rounded-full">
                    Potentially illegal
                  </span>
                )}
              </div>
              <blockquote className="text-xs text-[#444] italic border-l border-[#333] pl-3 leading-relaxed">
                "{flag.clause_text}"
              </blockquote>
              <p className="text-sm text-[#777] leading-relaxed">
                {flag.plain_english}
              </p>
              <div className="text-xs text-[#555] bg-[#161616] rounded-lg px-4 py-2.5 leading-relaxed">
                <span className="text-[#3a3a3a] font-medium">What to do: </span>
                {flag.what_to_do}
              </div>
              <ClauseChat clauseText={flag.clause_text} state={state} />
            </div>
          ))}
        </div>
      )}

      <div className="h-px bg-[#242424]" />

      {/* Positives */}
      {data.positives?.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-[#444]">
            ✓ What the landlord got right
          </div>
          <div className="flex flex-col">
            {data.positives.map((p, i) => (
              <div
                key={i}
                className="text-sm text-[#555] flex gap-3 items-start py-3 border-b border-[#151515] last:border-0"
              >
                <span className="text-[#2a5c2a] mt-0.5 text-xs">✓</span>
                {p}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}