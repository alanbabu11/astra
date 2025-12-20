// pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8000/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setDatasets(data);
        } else {
          console.error("Dashboard error:", data.msg);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleView = (ds) => {
    navigate(`/result/${ds.promptId?._id || ds.promptId}`);
  };

  const handleDownload = (ds) => {
    if (ds.downloadLink) {
      window.open(ds.downloadLink, "_blank");
    } else {
      alert("Download link not ready yet.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Your Datasets</h1>
          <p className="text-sm text-slate-400">
            Every prompt you submit appears here with status, preview & download.
          </p>
        </div>
        <button
          onClick={() => navigate("/userinput")}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-sm font-semibold"
        >
          + New Prompt
        </button>
      </header>

      {loading ? (
        <div className="text-sm text-slate-400">Loading datasets...</div>
      ) : datasets.length === 0 ? (
        <div className="text-sm text-slate-400">
          No datasets yet. Try creating one from the{" "}
          <b>New Prompt</b> page.
        </div>
      ) : (
        <div className="space-y-3">
          {datasets.map((ds) => {
            const promptText = ds.promptId?.text || "";
            const createdAt =
              ds.promptId?.createdAt || ds.createdAt || new Date().toISOString();
            const created = new Date(createdAt);

            const titleWords = promptText.split(/\s+/);
            const title =
              titleWords.length === 0
                ? "Untitled dataset"
                : titleWords.slice(0, 10).join(" ") +
                  (titleWords.length > 10 ? "…" : "");

            const dateStr = created.toLocaleDateString(undefined, {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });
            const dayStr = created.toLocaleDateString(undefined, {
              weekday: "short",
            });
            const timeStr = created.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={ds._id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col gap-2 hover:border-purple-500/60 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-50">
                      {title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {promptText}
                    </p>
                  </div>
                  <StatusBadge status={ds.status} />
                </div>

                <div className="text-[11px] text-slate-500 flex flex-wrap gap-3 mt-2">
                  <span>
                    Date: <span className="font-mono">{dateStr}</span>
                  </span>
                  <span>
                    Day: <span className="font-mono">{dayStr}</span>
                  </span>
                  <span>
                    Time: <span className="font-mono">{timeStr}</span>
                  </span>
                  {typeof ds.totalItems === "number" && (
                    <span>
                      Items:{" "}
                      <span className="font-mono">{ds.totalItems}</span>
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-3 text-xs">
                  <button
                    onClick={() => handleView(ds)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(ds)}
                    disabled={!ds.downloadLink || ds.status !== "completed"}
                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    Download
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${color}`}>
      {status?.toUpperCase() || "UNKNOWN"}
    </span>
  );
}
