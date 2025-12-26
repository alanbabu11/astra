import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function Dashboard() {
  const [datasets, setDatasets] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://localhost:8000/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setDatasets);
  }, [token]);

  // ✅ REAL DELETE (DB + UI)
  const performDelete = async (promptId) => {
    try {
      await fetch(`http://localhost:8000/dataset/${promptId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDatasets((prev) =>
        prev.filter((d) => d.promptId?._id !== promptId)
      );
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    performDelete(deleteTarget.promptId?._id || deleteTarget.promptId);
    setDeleteTarget(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-white">
      <h1 className="text-3xl font-bold">Your Datasets</h1>

      {datasets.map((ds) => (
        <div
          key={ds._id}
          className="border border-slate-800 rounded-xl p-4 bg-slate-900/70"
        >
          <p className="font-semibold">{ds.promptId?.text}</p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() =>
                navigate(`/result/${ds.promptId?._id || ds.promptId}`)
              }
              className="px-3 py-1.5 rounded-lg bg-slate-800"
            >
              View
            </button>

            <button
              onClick={() => window.open(ds.downloadLink)}
              disabled={!ds.downloadLink}
              className="px-3 py-1.5 rounded-lg bg-green-600 disabled:bg-slate-700"
            >
              Download
            </button>

            <button
              onClick={() => {
                const skip = localStorage.getItem(
                  "datagen_skip_delete_confirm"
                );
                skip === "true"
                  ? performDelete(ds.promptId?._id || ds.promptId)
                  : setDeleteTarget(ds);
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      <DeleteConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
