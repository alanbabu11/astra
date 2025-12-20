// components/AnimatedCard.jsx
import React, { useEffect, useRef } from "react";

export default function AnimatedCard({ children, className = "", delay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.animationDelay = `${delay}s`;
  }, [delay]);

  const base = "animate-fade-in-up";
  const merged = className ? `${base} ${className}` : base;

  return (
    <div ref={ref} className={merged}>
      {children}
    </div>
  );
}
