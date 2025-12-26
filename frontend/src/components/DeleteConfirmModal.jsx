import React, { useState } from "react";

export default function DeleteConfirmModal({ open, onClose, onConfirm }) {
  const [dontAskAgain, setDontAskAgain] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem("datagen_skip_delete_confirm", "true");
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white">
        <h2 className="text-lg font-bold text-red-400 mb-2">
          Delete Dataset?
        </h2>

        <p className="text-sm text-slate-300 mb-4">
          This action cannot be undone. The dataset and its preview will be
          permanently removed.
        </p>

        <label className="flex items-center gap-2 text-sm text-slate-300 mb-6">
          <input
            type="checkbox"
            className="accent-purple-500"
            checked={dontAskAgain}
            onChange={(e) => setDontAskAgain(e.target.checked)}
          />
          Don&apos;t ask me again
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-semibold"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
