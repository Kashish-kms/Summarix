import re
from typing import Optional


def clean_text(text: str) -> str:
    if text is None:
        return ""
    text = re.sub(r"\r\n|\r|\n", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\x00-\x1F\x7F", "", text)
    text = text.strip()
    return text


def chunk_text(
    text: str,
    max_tokens: int,
    tokenizer=None,
    overlap: int = 50,
) -> list[str]:
    cleaned = clean_text(text)
    if not cleaned:
        return []

    if tokenizer is None:
        words = cleaned.split()
        approx_tokens_per_word = 1.3
        chunk_size = max(1, int(max_tokens / approx_tokens_per_word))
        overlap_words = max(0, int(overlap / approx_tokens_per_word))

        chunks: list[str] = []
        i = 0
        while i < len(words):
            end = min(i + chunk_size, len(words))
            chunks.append(" ".join(words[i:end]))
            if end >= len(words):
                break
            i = end - overlap_words
        return chunks

    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    if not sentences:
        sentences = [cleaned]

    chunks: list[str] = []
    current_chunk: list[str] = []
    current_length = 0

    for sentence in sentences:
        try:
            sentence_tokens = len(
                tokenizer.encode(sentence, add_special_tokens=False)
            )
        except Exception:
            sentence_tokens = len(sentence.split())

        if current_length + sentence_tokens + 2 <= max_tokens:
            current_chunk.append(sentence)
            current_length += sentence_tokens + 1
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk))
            overlap_sentences: list[str] = []
            overlap_length = 0
            for s in reversed(current_chunk):
                try:
                    s_tokens = len(
                        tokenizer.encode(s, add_special_tokens=False)
                    )
                except Exception:
                    s_tokens = len(s.split())
                if overlap_length + s_tokens <= overlap:
                    overlap_sentences.insert(0, s)
                    overlap_length += s_tokens
                else:
                    break
            current_chunk = overlap_sentences + [sentence]
            current_length = 0
            for s in current_chunk:
                try:
                    current_length += (
                        len(tokenizer.encode(s, add_special_tokens=False)) + 1
                    )
                except Exception:
                    current_length += len(s.split()) + 1

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    if not chunks:
        chunks = [cleaned]

    return chunks
