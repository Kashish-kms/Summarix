from typing import Any

from rouge_score import rouge_scorer


def compute_rouge(reference: str, hypothesis: str) -> dict[str, dict[str, float]]:
    if not reference or not hypothesis:
        return {
            "rouge1": {"precision": 0.0, "recall": 0.0, "fmeasure": 0.0},
            "rouge2": {"precision": 0.0, "recall": 0.0, "fmeasure": 0.0},
            "rougeL": {"precision": 0.0, "recall": 0.0, "fmeasure": 0.0},
        }

    scorer = rouge_scorer.RougeScorer(
        ["rouge1", "rouge2", "rougeL"], use_stemmer=True
    )
    scores = scorer.score(reference, hypothesis)

    result: dict[str, dict[str, float]] = {}
    for key in ["rouge1", "rouge2", "rougeL"]:
        s = scores.get(key)
        if s is None:
            result[key] = {"precision": 0.0, "recall": 0.0, "fmeasure": 0.0}
        else:
            result[key] = {
                "precision": round(float(s.precision), 4),
                "recall": round(float(s.recall), 4),
                "fmeasure": round(float(s.fmeasure), 4),
            }
    return result
