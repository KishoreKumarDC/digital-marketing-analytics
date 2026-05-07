import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // ✅ role toggle
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const role = isAdmin ? "admin" : "user"; // ✅ determine role

      await registerUser(email, password, role); // ✅ pass role

      alert("Registration successful ✅");
      navigate("/");

    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert("Email already exists. Redirecting to login...");
        navigate("/");
      } else {
        alert(error.message);
      }
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">

        {/* 🔁 ROLE TOGGLE */}
        <div className="toggle">
          <button
            className={!isAdmin ? "active" : ""}
            onClick={() => setIsAdmin(false)}
          >
            User
          </button>

          <button
            className={isAdmin ? "active" : ""}
            onClick={() => setIsAdmin(true)}
          >
            Admin
          </button>
        </div>

        <h2 className="title-container">

  <span className="title-icon">
    {isAdmin ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
        <path d="M2 17l10 5 10-5"></path>
        <path d="M2 12l10 5 10-5"></path>
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    )}
  </span>

  <span className="title-text">
    {isAdmin ? "ADMIN REGISTRATION" : "USER REGISTRATION"}
  </span>

</h2>

        <p className="subtitle">Create your account</p>

        <Input type="email" placeholder="Email" onChange={setEmail} />
        <Input type="password" placeholder="Password" onChange={setPassword} />

        <Button title="Register" onClick={handleRegister} />

        <div className="links">
          <span onClick={() => navigate("/")}>Already have account?</span>
        </div>

      </div>
    </div>
  );
}