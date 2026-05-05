import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { resetPassword } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./login.css"; // reuse style

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      await resetPassword(email);

      alert("Reset email sent 📧");
      navigate("/");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card">

        <h2 className="title">Reset Password</h2>
        <p className="subtitle">Enter your email to reset</p>

        <Input type="email" placeholder="Email" onChange={setEmail} />

        <Button title="Send Reset Link" onClick={handleReset} />

        <div className="links">
          <span onClick={() => navigate("/")}>Back to Login</span>
        </div>

      </div>
    </div>
  );
}