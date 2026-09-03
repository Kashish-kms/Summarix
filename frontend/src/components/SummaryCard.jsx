import { useState } from "react";

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const METHOD_BADGE = {
  bart: { label: "BART", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  t5: { label: "T5", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  extractive: {
    label: "Extractive",
    cls: "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export default function SummaryCard({ result }) {
  const { method, summary, rouge_scores } = result || {};
  const [copied, setCopied] = useState(false);
  const badge = METHOD_BADGE[method] || {
    label: method,
    cls: "bg-gray-50 text-gray-700 border-gray-200",
  };

  async function copySummary() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badge.cls}`}
          >
            {badge.label}
          </span>
          <span className="text-xs text-gray-500">
            {wordCount(summary)} words
          </span>
        </div>
        <button
          type="button"
          onClick={copySummary}
          disabled={!summary}
          className="text-xs px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50 transition"
        >
          {copied ? "✓ Copied" : "Copy summary"}
        </button>
      </div>

      <div className="p-5">
        <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
          {summary || "—"}
        </p>

        {rouge_scores && Object.keys(rouge_scores).length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              ROUGE Scores
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-3 font-semibold text-gray-600">
                      Metric
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">
                      Precision
                    </th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-600">
                      Recall
                    </th>
                    <th className="text-right py-2 pl-3 font-semibold text-gray-600">
                      F1
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {["rouge1", "rouge2", "rougeL"].map((key) => {
                    const s = rouge_scores[key];
                    if (!s) return null;
                    const label =
                      key === "rouge1"
                        ? "ROUGE-1"
                        : key === "rouge2"
                        ? "ROUGE-2"
                        : "ROUGE-L";
                    return (
                      <tr
                        key={key}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2 pr-3 font-medium text-gray-700">
                          {label}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-700 tabular-nums">
                          {Number(s.precision).toFixed(4)}
                        </td>
                        <td className="text-right py-2 px-3 text-gray-700 tabular-nums">
                          {Number(s.recall).toFixed(4)}
                        </td>
                        <td className="text-right py-2 pl-3 text-indigo-700 font-semibold tabular-nums">
                          {Number(s.fmeasure).toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
