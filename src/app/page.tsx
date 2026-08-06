"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import Results from "@/components/Results";

export default function Home() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState("");

  function handleReset() {
    setAnalysis(null);
    setState("");
  }

  return (
    <main className="min-h-screen bg-[#141414]">
      <div className="max-w-2xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-4xl font-medium text-[#f5f0e8] tracking-tight mb-2">
            ClearLease
          </h1>
          <p className="text-sm text-[#555] tracking-wide">
            Upload your lease. Know your rights in minutes.
          </p>
        </div>

        {/* Upload */}
        {!analysis && !loading && (
          <div className="bg-[#1c1c1c] border border-[#282828] rounded-2xl p-8">
            <UploadForm
              onAnalysis={setAnalysis}
              onLoading={setLoading}
              onStateChange={setState}
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-24">
            <div
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-6xl font-medium text-[#c8a96e] mb-4 animate-pulse"
            >
              ⚖
            </div>
            <p className="text-sm text-[#444]">Analyzing your lease...</p>
            <p className="text-xs text-[#333] mt-2">This takes 10–20 seconds</p>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="flex flex-col gap-6">
            <Results data={analysis} state={state} />
            <button
              onClick={handleReset}
              className="text-xs text-[#333] hover:text-[#666] text-center transition-colors"
            >
              ← Analyze another lease
            </button>
          </div>
        )}

      </div>
    </main>
  );
}