import time
from typing import Optional

from fastapi import APIRouter, HTTPException

from schemas import (
    SummarizeRequest,
    SummaryResult,
    CompareResponse,
    RougeScore,
)
from models import summarize_bart, summarize_t5, summarize_extractive
from services import clean_text, compute_rouge

router = APIRouter()


METHOD_MAP = {
    "bart": summarize_bart,
    "t5": summarize_t5,
    "extractive": summarize_extractive,
}

MODEL_DESCRIPTIONS = {
    "bart": {
        "name": "BART (DistilBART-CNN)",
        "type": "abstractive",
        "description": "Distilled BART model fine-tuned on CNN/DailyMail. Produces fluent, abstractive summaries with a 1024-token context window.",
    },
    "t5": {
        "name": "T5 (t5-small)",
        "type": "abstractive",
        "description": "Text-to-Text Transfer Transformer (small). Prefixes input with 'summarize: ' and generates a 512-token context abstractive summary.",
    },
    "extractive": {
        "name": "TextRank (TF-IDF)",
        "type": "extractive",
        "description": "Unsupervised extractive summarizer using TextRank over TF-IDF cosine similarities between sentences. Selects top-N sentences by PageRank.",
    },
}


def _normalize_method(method: str) -> str:
    m = (method or "").strip().lower().replace(" ", "_").replace("-", "_")
    alias_map = {
        "bart": "bart",
        "t5": "t5",
        "text_rank": "extractive",
        "textrank": "extractive",
        "extractive": "extractive",
        "compare": "compare",
        "compare_all": "compare",
    }
    return alias_map.get(m, method.lower().strip())


def _run_method(
    method: str,
    text: str,
    reference_summary: Optional[str],
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    num_sentences: Optional[int] = None,
) -> SummaryResult:
    method = _normalize_method(method)
    cleaned = clean_text(text)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Input text is empty after cleaning")

    fn = METHOD_MAP.get(method)
    if fn is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown method '{method}'. Use one of: {list(METHOD_MAP.keys())}",
        )

    try:
        if method == "extractive":
            n = num_sentences if num_sentences is not None else (min_length if min_length is not None else 5)
            summary = fn(cleaned, num_sentences=max(1, int(n)))
        else:
            kwargs = {}
            if max_length is not None:
                kwargs["max_length"] = int(max_length)
            if min_length is not None:
                kwargs["min_length"] = int(min_length)
            summary = fn(cleaned, **kwargs)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Model inference failed for method '{method}': {str(e)}",
        )

    rouge_scores = None
    if reference_summary:
        ref_cleaned = clean_text(reference_summary)
        if ref_cleaned:
            raw = compute_rouge(ref_cleaned, summary)
            rouge_scores = {k: RougeScore(**v) for k, v in raw.items()}

    return SummaryResult(
        method=method,
        summary=summary,
        rouge_scores=rouge_scores,
    )


@router.post("/summarize", response_model=SummaryResult)
def summarize(request: SummarizeRequest) -> SummaryResult:
    return _run_method(
        request.method,
        request.text,
        request.reference_summary,
        min_length=request.min_length,
        max_length=request.max_length,
        num_sentences=request.num_sentences,
    )


@router.post("/compare", response_model=CompareResponse)
def compare(request: SummarizeRequest) -> CompareResponse:
    start = time.perf_counter()
    results: list[SummaryResult] = []
    for method in ["bart", "t5", "extractive"]:
        results.append(
            _run_method(
                method,
                request.text,
                request.reference_summary,
                min_length=request.min_length,
                max_length=request.max_length,
                num_sentences=request.num_sentences,
            )
        )
    elapsed_ms = (time.perf_counter() - start) * 1000
    return CompareResponse(results=results, processing_time_ms=round(elapsed_ms, 2))


@router.get("/models")
def list_models():
    return MODEL_DESCRIPTIONS
