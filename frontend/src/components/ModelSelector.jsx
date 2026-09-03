const OPTIONS = [
  { value: "bart", label: "BART", hint: "DistilBART · abstractive" },
  { value: "t5", label: "T5", hint: "t5-small · abstractive" },
  { value: "extractive", label: "Extractive", hint: "TextRank · TF-IDF" },
  { value: "compare", label: "Compare All", hint: "Run all 3 + ROUGE bar chart" },
];

export default function ModelSelector({ selectedMethod, setSelectedMethod }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Summarization method
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const active = selectedMethod === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedMethod(opt.value)}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                active
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <div
                className={`text-sm font-semibold ${
                  active ? "text-indigo-700" : "text-gray-800"
                }`}
              >
                {opt.label}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  active ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {opt.hint}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
