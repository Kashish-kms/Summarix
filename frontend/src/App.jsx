import { useState } from "react";
import TextInput from "./components/TextInput.jsx";
import ModelSelector from "./components/ModelSelector.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import RougeChart from "./components/RougeChart.jsx";
import { fetchSummary, fetchComparison } from "./api/summarize.js";
import "./App.css";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [referenceSummary, setReferenceSummary] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bart");
  const [results, setResults] = useState([]);
  const [isCompare, setIsCompare] = useState(false);
  const [processingTimeMs, setProcessingTimeMs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(null);

    if (!inputText.trim()) {
      setError("Please enter some text to summarize.");
      return;
    }

    setLoading(true);
    setResults([]);
    setProcessingTimeMs(null);

    try {
      if (selectedMethod === "compare") {
        const data = await fetchComparison(inputText, referenceSummary);
        setResults(data.results || []);
        setProcessingTimeMs(data.processing_time_ms);
        setIsCompare(true);
      } else {
        const result = await fetchSummary(
          inputText,
          selectedMethod,
          referenceSummary
        );
        setResults([result]);
        setIsCompare(false);
      }
    } catch (err) {
      setError(err.message || "Summarization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="border-b border-gray-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Summarix
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                BART · T5 · TextRank — with ROUGE-1/2/L evaluation
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Transformer-based summarization
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TextInput
            inputText={inputText}
            setInputText={setInputText}
            referenceSummary={referenceSummary}
            setReferenceSummary={setReferenceSummary}
          />

          <ModelSelector
            selectedMethod={selectedMethod}
            setSelectedMethod={setSelectedMethod}
          />

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeWidth="4"
                    />
                    <path
                      d="M22 12a10 10 0 0 1-10 10"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                  {selectedMethod === "compare"
                    ? "Running all 3 methods…"
                    : "Summarizing…"}
                </>
              ) : (
                <>
                  {selectedMethod === "compare"
                    ? "Compare all methods"
                    : "Summarize"}
                </>
              )}
            </button>

            {processingTimeMs != null && (
              <span className="text-xs text-gray-500">
                Processed in{" "}
                <span className="font-semibold text-gray-700">
                  {(processingTimeMs / 1000).toFixed(2)}s
                </span>
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <span className="font-semibold">Error: </span>
              {error}
            </div>
          )}
        </form>

        {results.length > 0 && (
          <section className="mt-10 space-y-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {isCompare ? "Comparison results" : "Summary"}
              </h2>
              {referenceSummary.trim() && (
                <span className="text-xs text-gray-500">
                  ROUGE scores computed against your reference summary
                </span>
              )}
            </div>

            {isCompare && <RougeChart results={results} />}

            <div className="grid gap-5 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1">
              {results.map((r) => (
                <SummaryCard key={r.method} result={r} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white/60 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-5 text-xs text-gray-500 flex flex-wrap items-center justify-between gap-2">
          <span>Summarix — Extract vs Abstract text summarization playground.</span>
          <span>FastAPI · PyTorch · React · Tailwind · Recharts</span>
        </div>
      </footer>
    </div>
  );
}
