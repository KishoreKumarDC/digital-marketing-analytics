import { useTheme } from "../hooks/useTheme"; // adjust path as needed
 
export function ThemeToggle() {
  const { dark, toggle } = useTheme();
 
  return (
    <button
      className="db-theme-toggle"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      type="button"
    >
      <span className="db-theme-label">{dark ? "Dark" : "Light"}</span>
      <div className="db-theme-track">
        <div className={`db-theme-pill ${dark ? "at-dark" : "at-light"}`} />
        <div className={`db-theme-option ${!dark ? "active" : ""}`}>
          <span className="db-theme-sun">☀️</span>
        </div>
        <div className={`db-theme-option ${dark ? "active" : ""}`}>
          <span className="db-theme-moon">🌙</span>
        </div>
      </div>
    </button>
  );
}