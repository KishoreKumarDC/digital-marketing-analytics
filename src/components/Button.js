export default function Button({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "12px",
        marginTop: "10px",
        borderRadius: "10px",
        border: "none",
        background: "linear-gradient(45deg, #ffffff, #aaaaaa)",
        color: "#000",
        fontWeight: "bold",
        cursor: "pointer",
        transition: "0.3s"
      }}
      onMouseOver={(e) => (e.target.style.opacity = "0.8")}
      onMouseOut={(e) => (e.target.style.opacity = "1")}
    >
      {title}
    </button>
  );
}