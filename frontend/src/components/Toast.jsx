import React, { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-slate-700",
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm shadow-xl ${colors[type]}`}
    >
      {message}
    </div>
  );
}
