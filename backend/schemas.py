from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


METHOD_ALIASES = {
    "bart": "bart",
    "t5": "t5",
    "text_rank": "extractive",
    "text-rank": "extractive",
    "textrank": "extractive",
    "extractive": "extractive",
    "compare": "compare",
    "compare-all": "compare",
    "compare_all": "compare",
}


class SummarizeRequest(BaseModel):
    text: Optional[str] = Field(
        default=None,
        description="The document text to summarize (also accepted as 'content' or 'source_text').",
    )
    content: Optional[str] = Field(
        default=None,
        description="Alias of 'text' — alternative frontend naming convention.",
    )
    source_text: Optional[str] = Field(
        default=None,
        description="Alias of 'text' — alternative frontend naming convention.",
    )
    method: Optional[str] = Field(
        default=None,
        description="Summarization method: bart, t5, extractive (also accepted as 'model' field).",
    )
    model: Optional[str] = Field(
        default=None,
        description="Alias of 'method' — alternative frontend naming convention.",
    )
    reference_summary: Optional[str] = Field(
        default=None,
        description="Optional reference summary for ROUGE evaluation.",
    )
    reference: Optional[str] = Field(
        default=None,
        description="Alias of 'reference_summary'.",
    )
    min_length: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional minimum output length in tokens (BART/T5) or sentences (extractive).",
    )
    max_length: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional maximum output length in tokens (BART/T5) or sentences (extractive).",
    )
    num_sentences: Optional[int] = Field(
        default=None,
        ge=1,
        description="Optional override for extractive summarization sentence count.",
    )

    @model_validator(mode="after")
    def resolve_aliases(self):
        if not self.text:
            for candidate in (self.content, self.source_text):
                if candidate:
                    self.text = candidate
                    break
        if not self.method:
            for candidate in (self.model,):
                if candidate:
                    m = candidate.strip().lower().replace(" ", "_")
                    self.method = METHOD_ALIASES.get(m, m)
                    break
        if not self.reference_summary:
            for candidate in (self.reference,):
                if candidate:
                    self.reference_summary = candidate
                    break
        return self

    @field_validator("text")
    @classmethod
    def ensure_text_present(cls, v):
        if v is None or not str(v).strip():
            raise ValueError("Field required: 'text' (or 'content' / 'source_text') must not be empty")
        return v

    @field_validator("method")
    @classmethod
    def ensure_method_present(cls, v):
        if v is None or not str(v).strip():
            raise ValueError("Field required: 'method' (or 'model') must not be empty")
        return str(v).strip().lower()


class RougeScore(BaseModel):
    precision: float
    recall: float
    fmeasure: float


class SummaryResult(BaseModel):
    method: str
    summary: str
    rouge_scores: Optional[dict[str, RougeScore]] = None


class CompareResponse(BaseModel):
    results: list[SummaryResult]
    processing_time_ms: float
