// pages/Profile.jsx
import React, { useEffect, useState } from "react";

export default function Profile() {
  const [geminiKey, setGeminiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("loading"); // loading | not_set | active

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setStatus("not_set");
      return;
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:8000/user/apikey", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.geminiKey) {
          setGeminiKey(data.geminiKey);
          setStatus("active");
        } else {
          setStatus("not_set");
        }
      } catch {
        setStatus("not_set");
      }
    })();
  }, []);

  const handleSaveKey = async (e) => {
    e.preventDefault();
    const trimmed = geminiKey.trim();
    if (!trimmed) return;

    const token = localStorage.getItem("token");
    if (!token) return alert("You must be logged in");

    setSaving(true);
    try {
      const res = await fetch("http://localhost:8000/user/apikey", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ geminiKey: trimmed }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiKey(data.geminiKey);
        setStatus("active");
      } else {
        alert(data.msg || "Error saving key");
      }
    } catch {
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  const credits = user.credits ?? "—";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Profile & Credits</h1>
        <p className="text-sm text-slate-400">
          Manage your account, credits, and Gemini API key used for dataset
          generation.
        </p>
      </div>

      {/* BASIC INFO + CREDITS */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Name</p>
            <p className="text-base font-semibold">
              {user.name || "Unknown user"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Email</p>
            <p className="text-base font-mono">
              {user.email || "not available"}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
          <p className="text-xs text-slate-400">Credits Remaining</p>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-purple-300">
              {credits}
            </p>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                style={{
                  width:
                    credits === "—"
                      ? "0%"
                      : `${Math.min((credits / 200) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Each dataset generation costs{" "}
            <span className="text-purple-300 font-semibold">10 credits</span>.
            New accounts start with{" "}
            <span className="text-purple-300 font-semibold">200 credits</span>.
          </p>
        </div>
      </div>

      {/* GEMINI KEY CARD */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Gemini API Key</h2>
            <p className="text-xs text-slate-400">
              This key is required before you can generate datasets from
              prompts.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
              status === "active"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-rose-500/15 text-rose-300"
            }`}
          >
            {status === "loading"
              ? "Checking…"
              : status === "active"
              ? "Active"
              : "Not set"}
          </span>
        </div>

        <form onSubmit={handleSaveKey} className="space-y-3">
          <input
            type="text"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-purple-500/60 focus:outline-none focus:border-purple-400 text-sm"
          />
          <button
            type="submit"
            disabled={saving || !geminiKey.trim()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
          >
            {saving ? "Saving…" : "Save Key"}
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          For production, store this key securely on the backend. Right now it
          is kept in your MongoDB user document for development.
        </p>
      </div>
    </div>
  );
}
