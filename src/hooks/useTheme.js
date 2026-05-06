import { useState, useEffect } from "react";
 
export function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("nexus-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
 
  useEffect(() => {
    // Toggle .dark on <html> so your CSS :root variables work globally
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("nexus-theme", dark ? "dark" : "light");
  }, [dark]);
 
  const toggle = () => setDark((d) => !d);
 
  return { dark, toggle };
}