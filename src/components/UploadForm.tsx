"use client";

import { useState } from "react";

const STATES = [
  { code: "CA", name: "California" },
  { code: "NY", name: "New York" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
  { code: "IL", name: "Illinois" },
];

interface Props {
  onAnalysis: (data: any) => void;
  onLoading: (loading: boolean) => void;
  onStateChange: (state: string) => void;
}

export default function UploadForm({ onAnalysis, onLoading, onStateChange }: Props) {
  const [state, setState] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  async function processFile(file: File) {
    if (!state) {
      setError("Please select your state before uploading.");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt"].includes(ext ?? "")) {
      setError("Please upload a .pdf or .txt file.");
      return;
    }
    setFileName(file.name);
    setError("");
    onLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("state", state);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Analysis failed");
      }
      const data = await res.json();
      onAnalysis(data);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Try a different file.");
    } finally {
      onLoading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* State selector */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium uppercase tracking-widest text-[#444]">
          Your state <span className="text-[#7a2020]">*</span>
        </label>
        <select
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            onStateChange(e.target.value);
            setError("");
          }}
          className="bg-[#242424] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#888] focus:outline-none focus:border-[#444] transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled>Select your state...</option>
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Upload area */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-medium uppercase tracking-widest text-[#444]">
          Upload your lease <span className="text-[#7a2020]">*</span>
        </label>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer border border-dashed rounded-xl p-10 text-center transition-all ${
            dragging
              ? "border-[#444] bg-[#161616]"
              : !state
              ? "border-[#242424] opacity-40 cursor-not-allowed"
              : "border-[#333] hover:border-[#3a3a3a] hover:bg-[#1c1c1c]"
          }`}
        >
          <input
            type="file"
            accept=".txt,.pdf"
            onChange={handleFileInput}
            disabled={!state}
            className="hidden"
          />
          <div className="text-3xl mb-3 text-[#333]">
            {fileName ? "✓" : "↑"}
          </div>
          <div className="text-sm text-[#555]">
            {fileName ? fileName : !state ? "Select a state first" : "Click or drag & drop your lease"}
          </div>
          <div className="text-xs text-[#333] mt-1">
            {fileName ? "Click to upload a different file" : ".pdf or .txt · max 10MB"}
          </div>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="text-xs text-[#c44] bg-[#1a0f0f] border border-[#2a1515] px-4 py-3 rounded-lg flex gap-2 items-start">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

    </div>
  );
}