import re
from typing import Optional

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    BartTokenizer,
    BartForConditionalGeneration,
)

BART_MODEL_NAME = "sshleifer/distilbart-cnn-12-6"
BART_MAX_TOKENS = 1024

T5_MODEL_NAME = "t5-small"
T5_MAX_TOKENS = 512

_device = "cuda" if torch.cuda.is_available() else "cpu"

_bart_tokenizer: Optional[BartTokenizer] = None
_bart_model: Optional[BartForConditionalGeneration] = None

_t5_tokenizer: Optional[AutoTokenizer] = None
_t5_model: Optional[AutoModelForSeq2SeqLM] = None


def _load_bart():
    global _bart_tokenizer, _bart_model
    if _bart_tokenizer is None or _bart_model is None:
        _bart_tokenizer = BartTokenizer.from_pretrained(BART_MODEL_NAME)
        _bart_model = BartForConditionalGeneration.from_pretrained(BART_MODEL_NAME).to(
            _device
        )
        _bart_model.eval()
    return _bart_tokenizer, _bart_model


def _load_t5():
    global _t5_tokenizer, _t5_model
    if _t5_tokenizer is None or _t5_model is None:
        _t5_tokenizer = AutoTokenizer.from_pretrained(T5_MODEL_NAME)
        _t5_model = AutoModelForSeq2SeqLM.from_pretrained(T5_MODEL_NAME).to(_device)
        _t5_model.eval()
    return _t5_tokenizer, _t5_model


def _chunk_text(
    text: str, tokenizer, max_tokens: int, overlap: int = 50
) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: list[str] = []
    current_chunk: list[str] = []
    current_length = 0

    for sentence in sentences:
        sentence_tokens = len(tokenizer.encode(sentence, add_special_tokens=False))
        if current_length + sentence_tokens + 2 <= max_tokens:
            current_chunk.append(sentence)
            current_length += sentence_tokens + 1
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            overlap_sentences: list[str] = []
            overlap_length = 0
            for s in reversed(current_chunk):
                s_tokens = len(tokenizer.encode(s, add_special_tokens=False))
                if overlap_length + s_tokens <= overlap:
                    overlap_sentences.insert(0, s)
                    overlap_length += s_tokens
                else:
                    break
            current_chunk = overlap_sentences + [sentence]
            current_length = sum(
                len(tokenizer.encode(s, add_special_tokens=False)) + 1
                for s in current_chunk
            )

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    if not chunks:
        chunks = [text]

    return chunks


def _summarize_chunks(
    chunks: list[str],
    tokenizer,
    model,
    max_length: int,
    min_length: int,
    prefix: str = "",
) -> str:
    summaries = []
    for chunk in chunks:
        prefixed = f"{prefix}{chunk}" if prefix else chunk
        inputs = tokenizer(
            prefixed,
            return_tensors="pt",
            truncation=True,
            max_length=tokenizer.model_max_length or max_length,
            padding=True,
        ).to(_device)

        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                attention_mask=inputs["attention_mask"],
                max_length=max_length,
                min_length=min_length,
                num_beams=4,
                length_penalty=2.0,
                early_stopping=True,
                do_sample=False,
            )

        summary = tokenizer.decode(
            summary_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=True
        )
        summaries.append(summary.strip())

    merged = " ".join(summaries).strip()
    return re.sub(r"\s+", " ", merged)


def summarize_bart(
    text: str,
    max_length: int = 142,
    min_length: int = 56,
) -> str:
    tokenizer, model = _load_bart()
    chunks = _chunk_text(text, tokenizer, BART_MAX_TOKENS)
    return _summarize_chunks(chunks, tokenizer, model, max_length, min_length)


def summarize_t5(
    text: str,
    max_length: int = 150,
    min_length: int = 40,
) -> str:
    tokenizer, model = _load_t5()
    chunks = _chunk_text(text, tokenizer, T5_MAX_TOKENS)
    return _summarize_chunks(
        chunks, tokenizer, model, max_length, min_length, prefix="summarize: "
    )


_load_bart()
_load_t5()
