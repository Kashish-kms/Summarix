import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function RougeChart({ results }) {
  if (!results || results.length === 0) return null;

  const hasRouge = results.some(
    (r) => r.rouge_scores && Object.keys(r.rouge_scores).length > 0
  );
  if (!hasRouge) return null;

  const methodNames = {
    bart: "BART",
    t5: "T5",
    extractive: "TextRank",
  };

  const data = results.map((r) => ({
    method: methodNames[r.method] || r.method,
    "ROUGE-1 F1": Number(
      (r.rouge_scores && r.rouge_scores.rouge1 && r.rouge_scores.rouge1.fmeasure) || 0
    ),
    "ROUGE-2 F1": Number(
      (r.rouge_scores && r.rouge_scores.rouge2 && r.rouge_scores.rouge2.fmeasure) || 0
    ),
    "ROUGE-L F1": Number(
      (r.rouge_scores && r.rouge_scores.rougeL && r.rouge_scores.rougeL.fmeasure) || 0
    ),
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        ROUGE F1 comparison across methods
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="method" tick={{ fontSize: 12 }} stroke="#6b7280" />
            <YAxis
              domain={[0, 1]}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip
              formatter={(v) => Number(v).toFixed(4)}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="ROUGE-1 F1"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="ROUGE-2 F1"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="ROUGE-L F1"
              fill="#f59e0b"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
