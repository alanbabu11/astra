// components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PlusCircle,
  User,
  LogOut,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const credits = user?.credits ?? "—";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/signin");
  };

  return (
    <aside className="w-16 md:w-20 border-r border-slate-800 bg-slate-950/95 backdrop-blur flex flex-col items-center">
      {/* Logo / Home */}
      <button
        onClick={() => navigate("/")}
        className="mt-4 mb-6 flex flex-col items-center gap-1"
      >
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-extrabold">
          DG
        </div>
        <span className="text-[10px] text-slate-400">Home</span>
      </button>

      {/* Nav icons */}
      <nav className="flex-1 flex flex-col items-center gap-3 text-[11px] md:text-xs">
        <NavIcon to="/dashboard" label="Dash">
          <LayoutDashboard size={18} />
        </NavIcon>
        <NavIcon to="/userinput" label="New">
          <PlusCircle size={18} />
        </NavIcon>
        <NavIcon to="/profile" label="Profile">
          <User size={18} />
        </NavIcon>
      </nav>

      {/* Credits + logout */}
      <div className="w-full px-2 pb-4 space-y-2 text-[10px] text-slate-400">
        <div className="flex flex-col items-center gap-1">
          <span>Credits</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-semibold text-[10px]">
            {credits}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}

function NavIcon({ to, label, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition ${
          isActive
            ? "bg-purple-500/20 text-purple-200 border border-purple-500/40"
            : "text-slate-300 hover:bg-slate-900"
        }`
      }
    >
      {children}
      <span>{label}</span>
    </NavLink>
  );
}
