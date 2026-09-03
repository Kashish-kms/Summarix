import re

import networkx as nx
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _split_sentences(text: str) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    raw = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in raw if s.strip()]


def summarize_extractive(text: str, num_sentences: int = 5) -> str:
    sentences = _split_sentences(text)
    if len(sentences) <= num_sentences:
        return " ".join(sentences)

    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        token_pattern=r"(?u)\b\w\w+\b",
    )
    try:
        tfidf_matrix = vectorizer.fit_transform(sentences)
    except ValueError:
        return " ".join(sentences[:num_sentences])

    if tfidf_matrix.shape[0] < 2 or tfidf_matrix.shape[1] == 0:
        return " ".join(sentences[:num_sentences])

    sim_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
    sim_matrix = np.nan_to_num(sim_matrix, nan=0.0, posinf=0.0, neginf=0.0)
    np.fill_diagonal(sim_matrix, 0.0)

    graph = nx.from_numpy_array(sim_matrix)
    try:
        scores = nx.pagerank(graph, max_iter=500)
    except (nx.PowerIterationFailedConvergence, ZeroDivisionError):
        scores = {i: float(sim_matrix[i].sum()) for i in range(len(sentences))}

    ranked = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    top_indices = sorted(i for i, _ in ranked[:num_sentences])

    return " ".join(sentences[i] for i in top_indices)
