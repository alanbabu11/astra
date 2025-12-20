// pages/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

export default function ResultPage() {
  const { promptId } = useParams();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    let intervalId;

    const fetchDataset = async () => {
      try {
        const res = await fetch(`http://localhost:8000/prompt/${promptId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.msg || "Failed to load dataset");
          setLoading(false);
          setPolling(false);
          return;
        }

        setDataset(data);
        setLoading(false);

        if (data.status === "completed" || data.status === "failed") {
          setPolling(false);
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error(err);
        setError("Server error while fetching dataset");
        setLoading(false);
        setPolling(false);
        if (intervalId) clearInterval(intervalId);
      }
    };

    fetchDataset();

    intervalId = setInterval(() => {
      if (polling) fetchDataset();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [promptId, polling, token]);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-medium">Preparing your dataset…</p>
        </div>
        <p className="mt-2 text-sm text-gray-300">
          We&apos;re generating keywords, scraping sources and structuring your
          JSON dataset.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link
            to="/userinput"
            className="inline-block bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-600 transition"
          >
            Back to prompt
          </Link>
        </div>
      </div>
    );
  }

  if (!dataset) return null;

  const createdAt = dataset.promptCreatedAt || dataset.createdAt;
  const created = createdAt ? new Date(createdAt) : new Date();
  const dateStr = created.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dayStr = created.toLocaleDateString(undefined, { weekday: "short" });
  const timeStr = created.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const previewItems = (dataset.preview || []).slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Dataset for your prompt
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Prompt ID: <span className="font-mono">{promptId}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Created on <span className="font-mono">{dateStr}</span> (
            {dayStr}) at <span className="font-mono">{timeStr}</span>
          </p>
        </div>
        <StatusBadge status={dataset.status} />
      </div>

      {/* PROMPT */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-2 text-purple-200">
          Your Prompt
        </h2>
        <p className="text-gray-100 whitespace-pre-wrap text-sm">
          {dataset.promptText || "(prompt text not loaded)"}
        </p>
      </div>

      {/* KEYWORDS */}
      {dataset.keywords && dataset.keywords.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-purple-200">
              Generated Keywords
            </h2>
            <p className="text-xs text-slate-400">
              {dataset.keywords.length} keyword
              {dataset.keywords.length !== 1 && "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {dataset.keywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/40 text-xs"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-purple-200">
            Dataset Preview
          </h2>
          <p className="text-xs text-gray-400">
            Total items:{" "}
            <span className="font-mono">
              {dataset.totalItems ?? (dataset.preview || []).length}
            </span>
          </p>
        </div>

        {dataset.status !== "completed" && (
          <p className="text-xs text-yellow-300">
            We&apos;re still finishing your dataset. This page refreshes every
            few seconds until it&apos;s ready.
          </p>
        )}

        {previewItems.length > 0 ? (
          <div className="space-y-2">
            {previewItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 flex flex-col gap-1"
              >
                {item.title && (
                  <p className="text-sm font-semibold text-slate-50">
                    {item.title}
                  </p>
                )}
                {(item.keywordUsed || item.keyword) && (
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">
                    Keyword:{" "}
                    <span className="text-purple-300 font-semibold">
                      {item.keywordUsed || item.keyword}
                    </span>
                  </p>
                )}
                <p className="text-sm text-gray-200 max-h-24 overflow-hidden">
                  {item.content || "(no content)"}
                </p>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-[11px] text-blue-400 hover:underline break-all"
                  >
                    {item.url}
                  </a>
                )}
              </div>
            ))}
            {dataset.preview && dataset.preview.length > previewItems.length && (
              <p className="text-[11px] text-slate-400">
                +{" "}
                {dataset.preview.length - previewItems.length} more items in the
                full dataset.
              </p>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No preview available yet.</p>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-3">
          {dataset.downloadLink && dataset.status === "completed" && (
            <a
              href={dataset.downloadLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-sm font-semibold"
            >
              Download Full Dataset
            </a>
          )}

          <Link
            to="/userinput"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold"
          >
            New Prompt
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  let color = "bg-slate-700 text-slate-200";
  if (status === "processing") color = "bg-yellow-500/20 text-yellow-300";
  if (status === "keywords_done") color = "bg-blue-500/20 text-blue-300";
  if (status === "completed") color = "bg-green-500/20 text-green-300";
  if (status === "failed") color = "bg-red-500/20 text-red-300";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
      {status?.toUpperCase() || "UNKNOWN"}
    </span>
  );
}
