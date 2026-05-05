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

        <h2 className="title">
          {isAdmin ? "Register as Admin 👑" : "Register as User 👤"}
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