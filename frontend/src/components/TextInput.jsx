import { useState } from "react";

const SAMPLE_ARTICLE = `Artificial intelligence (AI) has rapidly transformed the field of natural language processing over the past decade. Transformer architectures, first introduced in 2017, have become the dominant approach for most NLP tasks, including text summarization. Both extractive and abstractive methods have benefited from these advances. Extractive summarization works by selecting the most important sentences from the source document and stitching them together, while abstractive summarization generates entirely new sentences that capture the document's essence. Researchers often evaluate summarization quality using ROUGE metrics, which measure the overlap of n-grams between a system summary and a human-written reference summary. Deploying these models in production requires careful engineering: chunking long documents, managing memory constraints, and optimizing inference latency while preserving output quality.`;

function WordCounts({ text, label }) {
  const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = text ? text.length : 0;
  return (
    <div className="flex gap-4 text-xs text-gray-500">
      <span>
        {label}: <span className="font-semibold text-gray-700">{words}</span> words ·{" "}
        <span className="font-semibold text-gray-700">{chars}</span> chars
      </span>
    </div>
  );
}

export default function TextInput({
  inputText,
  setInputText,
  referenceSummary,
  setReferenceSummary,
}) {
  const [copiedSample, setCopiedSample] = useState(false);

  function loadSample() {
    setInputText(SAMPLE_ARTICLE);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 1200);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="input-text" className="text-sm font-medium text-gray-700">
            Document to summarize
          </label>
          <button
            type="button"
            onClick={loadSample}
            className="text-xs px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
          >
            {copiedSample ? "✓ Sample loaded" : "Load sample article"}
          </button>
        </div>
        <textarea
          id="input-text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={14}
          placeholder="Paste a news article, research paper, or any long-form text here..."
          className="w-full rounded-lg border border-gray-300 p-4 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-y transition"
        />
        <div className="mt-2">
          <WordCounts text={inputText} label="Document" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="reference-summary"
            className="text-sm font-medium text-gray-700"
          >
            Reference summary <span className="font-normal text-gray-500">(optional, for ROUGE evaluation)</span>
          </label>
        </div>
        <textarea
          id="reference-summary"
          value={referenceSummary}
          onChange={(e) => setReferenceSummary(e.target.value)}
          rows={4}
          placeholder="If you have a human-written reference summary, paste it here to see ROUGE scores..."
          className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none resize-y transition"
        />
        <div className="mt-2">
          <WordCounts text={referenceSummary} label="Reference" />
        </div>
      </div>
    </div>
  );
}
