// pages/ResultPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function ResultPage() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 🔔 TOAST STATE
  const [toast, setToast] = useState("");

  // --------------------------------------------------
  // FETCH DATASET
  // --------------------------------------------------
  useEffect(() => {
    let intervalId;

    const fetchDataset = async () => {
      try {
        const res = await fetch(`http://localhost:8000/prompt/${promptId}`, {
          headers: { Authorization: `Bearer ${token}` },
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
          clearInterval(intervalId);
        }
      } catch {
        setError("Server error while fetching dataset");
        setLoading(false);
        setPolling(false);
        clearInterval(intervalId);
      }
    };

    fetchDataset();
    intervalId = setInterval(() => polling && fetchDataset(), 3000);

    return () => clearInterval(intervalId);
  }, [promptId, polling, token]);

  // --------------------------------------------------
  // REAL DELETE (BACKEND + TOAST)
  // --------------------------------------------------
  const handleDelete = async () => {
    try {
      setPolling(false);

      await fetch(`http://localhost:8000/dataset/${promptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setShowDeleteModal(false);
      setToast("Dataset deleted successfully");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1200);
    } catch (err) {
      console.error("Delete failed:", err);
      setToast("Failed to delete dataset");
    }
  };

  // --------------------------------------------------
  // UI STATES
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex justify-center py-20 text-white">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          Preparing your dataset…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-20 text-red-400">
        {error}
      </div>
    );
  }

  if (!dataset) return null;

  const previewItems = (dataset.preview || []).slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-white relative">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dataset for your prompt</h1>
        <StatusBadge status={dataset.status} />
      </div>

      {/* PROMPT */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-purple-200 mb-2">
          Your Prompt
        </h2>
        <p className="text-sm">{dataset.promptText}</p>
      </div>

      {/* KEYWORDS */}
      {dataset.keywords?.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-purple-200 mb-2">
            Generated Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {dataset.keywords.map((kw, i) => (
              <span
                key={i}
                className="px-3 py-1 text-xs rounded-full
                bg-purple-500/10 border border-purple-500/40"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* PREVIEW */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-purple-200 mb-2">
          Dataset Preview
        </h2>

        {previewItems.map((item, i) => (
          <div
            key={i}
            className="border border-slate-800 rounded-xl p-3 mb-2 bg-slate-950/60"
          >
            <p className="font-semibold">{item.title}</p>
            <p className="text-xs text-purple-300 uppercase">
              {item.keywordUsed}
            </p>
            <p className="text-sm text-slate-300">{item.content}</p>
          </div>
        ))}
      </div>

      {/* ACTION BAR */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="text-xs text-slate-400">
          {dataset.status === "completed"
            ? "Your dataset is ready to download."
            : "Dataset is still being processed."}
        </div>

        <div className="flex gap-3">
          {dataset.downloadLink && dataset.status === "completed" && (
            <a
              href={dataset.downloadLink}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-lg bg-green-500 hover:bg-green-600 font-semibold"
            >
              Download Dataset
            </a>
          )}

          <button
            onClick={() => {
              const skip = localStorage.getItem(
                "datagen_skip_delete_confirm"
              );
              skip === "true"
                ? handleDelete()
                : setShowDeleteModal(true);
            }}
            className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 font-semibold"
          >
            Delete Dataset
          </button>

          <Link
            to="/userinput"
            className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold"
          >
            New Prompt
          </Link>
        </div>
      </div>

      {/* DELETE MODAL */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      {/* 🔔 TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------
function StatusBadge({ status }) {
  const map = {
    processing: "bg-yellow-500/20 text-yellow-300",
    keywords_done: "bg-blue-500/20 text-blue-300",
    completed: "bg-green-500/20 text-green-300",
    failed: "bg-red-500/20 text-red-300",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs ${map[status]}`}>
      {status?.toUpperCase()}
    </span>
  );
}
