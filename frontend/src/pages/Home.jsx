// pages/Home.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState("");

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    console.log("Feedback:", feedback);
    setFeedback("");
    alert("Thanks for your feedback!");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* TOP NAVBAR */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-extrabold">
              D
            </div>
            <span className="font-semibold tracking-tight">
              Datagen Studio
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#feedback" className="hover:text-white">
              Feedback
            </a>
            <a href="#how" className="hover:text-white">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/signin")}
              className="px-4 py-1.5 rounded-lg border border-slate-700 hover:border-purple-500 hover:text-purple-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 font-semibold"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Turn <span className="text-purple-400">one prompt</span> into a
              ready-to-train{" "}
              <span className="text-indigo-400">LLM dataset</span>.
            </h1>
            <p className="text-slate-300 mb-6 text-sm md:text-base">
              Datagen automatically extracts keywords, scrapes the web,
              structures the content, and gives you a clean dataset preview +
              download for your models.
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => navigate("/signup")}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-sm md:text-base font-semibold"
              >
                Get Started – it’s free
              </button>
              <button
                onClick={() => navigate("/signin")}
                className="px-6 py-2.5 rounded-xl border border-slate-700 hover:border-purple-400 text-sm md:text-base"
              >
                Already have an account?
              </button>
            </div>

            <p className="text-xs text-slate-500">
              No credit card required. Just sign in, type a prompt, and get your
              dataset.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl shadow-purple-900/20">
            <p className="text-xs text-slate-400 mb-2 font-mono">
              LIVE PREVIEW
            </p>
            <div className="bg-slate-950/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Status</span>
                <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs font-semibold">
                  KEYWORDS_DONE
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Prompt:{" "}
                <span className="text-slate-100">
                  “Create a dataset about EV adoption in India”
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {["electric vehicles", "india market", "adoption trends"].map(
                  (k) => (
                    <span
                      key={k}
                      className="px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/40 text-[11px]"
                    >
                      {k}
                    </span>
                  )
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                “We’re scraping sources and structuring your dataset. You’ll get
                a JSON preview and a full download link when ready.”
              </p>
            </div>
          </div>
        </section>

        {/* Feedback section */}
        <section
          id="feedback"
          className="border-t border-slate-800 bg-slate-950/80"
        >
          <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">Feedback</h2>
              <p className="text-slate-300 text-sm">
                Tell us what you want Datagen to do better – new features, UI
                improvements, or dataset formats.
              </p>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full h-24 rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-sm font-semibold"
              >
                Submit Feedback
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-slate-500 py-4 border-t border-slate-900">
        Built for dataset generation • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
