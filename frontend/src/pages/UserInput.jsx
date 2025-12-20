// pages/UserInput.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOrb from "../components/LoadingOrb";

export default function UserInput() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  const navigate = useNavigate();

  // Check Gemini API key on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setHasKey(false);
      setCheckingKey(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("http://localhost:8000/user/apikey", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.geminiKey) {
          setHasKey(true);
        } else {
          setHasKey(false);
        }
      } catch {
        setHasKey(false);
      } finally {
        setCheckingKey(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!prompt.trim()) {
      return setError("Prompt cannot be empty.");
    }
    if (!hasKey) {
      return setError("Set your Gemini API key in Profile before generating.");
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("You must be logged in!");

      setLoadingSubmit(true);

      const res = await fetch("http://localhost:8000/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (res.ok) {
        // update credits in localStorage user
        if (typeof data.credits === "number") {
          try {
            const stored = JSON.parse(localStorage.getItem("user") || "{}");
            stored.credits = data.credits;
            localStorage.setItem("user", JSON.stringify(stored));
          } catch {}
        }
        navigate(`/result/${data.promptId}`);
      } else {
        setError(data.msg || "Something went wrong.");
        setLoadingSubmit(false);
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again.");
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      {loadingSubmit && (
        <LoadingOrb title="Generating your dataset…" />
      )}

      <div className="w-full flex items-center justify-center">
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Create New Dataset
          </h1>
          <p className="text-center text-slate-400 text-sm">
            Describe the dataset you want. Datagen extracts keywords, scrapes
            the web and builds a JSON dataset.
          </p>

          {checkingKey && (
            <p className="text-center text-xs text-slate-400">
              Checking your Gemini API key…
            </p>
          )}

          {!checkingKey && !hasKey && (
            <p className="text-center text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2">
              You haven&apos;t added a Gemini API key yet. Go to{" "}
              <span className="font-semibold">Profile</span> and save your key
              to enable dataset generation.
            </p>
          )}

          {error && (
            <p className="text-red-400 text-center text-sm">{error}</p>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <textarea
              name="prompt"
              placeholder="Example: Create a dataset of EV adoption by country with year-wise numbers, growth rate, and region tags…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              className="w-full h-40 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 focus:outline-none focus:border-purple-500 text-sm"
            />

            <button
              type="submit"
              disabled={loadingSubmit || !hasKey}
              className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold transition"
            >
              {loadingSubmit ? "Generating…" : "Generate Dataset"}
            </button>

            <p className="text-center text-[11px] text-slate-500">
              ⚡ Each generation costs{" "}
              <span className="text-purple-300 font-semibold">10 credits</span>.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
