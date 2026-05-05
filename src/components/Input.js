export default function Input({ type, placeholder, onChange }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "12px",
        marginBottom: "12px",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.2)",
        background: "rgba(255,255,255,0.05)",
        color: "white",
        outline: "none"
      }}
    />
  );
}