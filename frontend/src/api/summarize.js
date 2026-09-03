const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const REQUEST_TIMEOUT_MS = 180000;

async function requestWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const err = await res.json();
        if (err && err.detail) msg = String(err.detail);
      } catch (_) {}
      throw new Error(msg);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      throw new Error(
        "Request timed out. Model inference can take a while — please try again with a shorter text."
      );
    }
    throw err;
  }
}

export async function fetchSummary(text, method, referenceSummary) {
  const body = {
    text,
    method,
  };
  if (referenceSummary && referenceSummary.trim()) {
    body.reference_summary = referenceSummary;
  }
  try {
    return await requestWithTimeout(
      `${API_BASE}/api/summarize`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );
  } catch (err) {
    console.error("fetchSummary failed:", err);
    throw err;
  }
}

export async function fetchComparison(text, referenceSummary) {
  const body = {
    text,
    method: "compare",
  };
  if (referenceSummary && referenceSummary.trim()) {
    body.reference_summary = referenceSummary;
  }
  try {
    return await requestWithTimeout(
      `${API_BASE}/api/compare`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );
  } catch (err) {
    console.error("fetchComparison failed:", err);
    throw err;
  }
}
