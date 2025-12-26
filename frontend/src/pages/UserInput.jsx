// pages/UserInput.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingOrb from "../components/LoadingOrb";
import { FileText } from "lucide-react";
import { TypeAnimation } from "react-type-animation";

export default function UserInput() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  const navigate = useNavigate();

  // --------------------------------------------------
  // CHECK GEMINI API KEY
  // --------------------------------------------------
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
        setHasKey(Boolean(res.ok && data.geminiKey));
      } catch {
        setHasKey(false);
      } finally {
        setCheckingKey(false);
      }
    })();
  }, []);

  // --------------------------------------------------
  // SUBMIT PROMPT
  // --------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!prompt.trim()) return setError("Prompt cannot be empty.");
    if (!hasKey)
      return setError("Add your Gemini API key in Profile to continue.");

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
        if (typeof data.credits === "number") {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          stored.credits = data.credits;
          localStorage.setItem("user", JSON.stringify(stored));
        }
        navigate(`/result/${data.promptId}`);
      } else {
        setError(data.msg || "Something went wrong.");
        setLoadingSubmit(false);
      }
    } catch {
      setError("Server error. Try again.");
      setLoadingSubmit(false);
    }
  };

  return (
    <>
      {loadingSubmit && <LoadingOrb title="Generating your dataset…" />}

      <div className="min-h-screen flex items-center justify-center px-6 text-white">
        <div className="w-full max-w-3xl text-center space-y-8">
          {/* ICON */}
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
              <FileText className="w-7 h-7 text-purple-400" />
            </div>
          </div>

          {/* TITLE */}
          <h1 className="text-3xl md:text-4xl font-bold">
            Generate a Dataset
          </h1>

          {/* TYPING DESCRIPTION (NO SHAKE – FIXED HEIGHT) */}
          <div className="h-[48px] flex items-center justify-center">
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              <TypeAnimation
                sequence={[
                  "Create datasets by simply describing what you need.",
                  2000,
                  "Datagen extracts keywords, scrapes the web, and builds JSON.",
                  2000,
                  "Perfect for research, analytics, and AI projects.",
                  2000,
                ]}
                speed={50}
                repeat={Infinity}
                cursor={false}
              />
            </p>
          </div>

          {/* WARNINGS */}
          {checkingKey && (
            <p className="text-xs text-slate-400">
              Checking Gemini API key…
            </p>
          )}

          {!checkingKey && !hasKey && (
            <p className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2">
              Add your Gemini API key in <b>Profile</b> to enable generation.
            </p>
          )}

          {/* PROMPT INPUT */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Typing hint ABOVE input (NO LAYOUT SHIFT) */}
            <div className="h-[20px] text-xs text-slate-400 text-left pl-1">
              <TypeAnimation
                sequence={[
                  "Describe the dataset you want…",
                  1500,
                  "Example: EV adoption by country with YoY growth…",
                  1500,
                  "Example: Startup funding rounds by sector…",
                  1500,
                ]}
                speed={60}
                repeat={Infinity}
                cursor
              />
            </div>

            <div className="flex gap-3 items-center">
              {/* PERFECTLY CENTERED INPUT */}
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the dataset you want..."
                className="
                  flex-1 h-14 px-5 rounded-xl
                  bg-slate-900 border border-slate-700
                  focus:outline-none focus:border-purple-500
                  text-sm leading-none
                  placeholder:text-slate-500
                "
              />

              <button
                type="submit"
                disabled={loadingSubmit || !hasKey}
                className="
                  h-14 px-6 rounded-xl
                  bg-purple-600 hover:bg-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  font-semibold text-sm transition
                "
              >
                Generate →
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </form>

          {/* EXAMPLES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-400 pt-4">
            {[
              "EV adoption by country with yearly growth",
              "Startup funding trends by sector",
              "Climate temperature data by region",
              "Social media sentiment dataset on AI tools",
            ].map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="
                  text-left px-4 py-2 rounded-lg
                  bg-slate-900 hover:bg-slate-800
                  border border-slate-800 transition
                "
              >
                {ex} →
              </button>
            ))}
          </div>

          {/* FOOTER NOTE */}
          <p className="text-[11px] text-slate-500 pt-2">
            ⚡ Each dataset generation costs{" "}
            <span className="text-purple-300 font-semibold">
              10 credits
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
