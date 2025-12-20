// layouts/DashboardLayout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [token, setToken] = React.useState(() =>
    localStorage.getItem("token")
  );

  React.useEffect(() => {
    if (!token) navigate("/signin");
  }, [token, navigate]);

  React.useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem("token"));
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
