import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { loginUser, getUserRole } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      const role = await getUserRole(res.user.uid);

      if (role !== "admin") {
        alert("Access Denied! Not an admin");
        return;
      }

      navigate("/admin");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="login-container">
      <h1 className="main-headline">Digital Marketing Analytics</h1>

      <div className="glass-card">
        <div className="title-container">
          <div className="title-icon">🔐</div>
          <div className="title-text">ADMIN ACCESS</div>
        </div>

        <div className="input-group">
          <Input type="email" placeholder="Email" onChange={setEmail} />
          <Input type="password" placeholder="Password" onChange={setPassword} />
        </div>

        <Button title="Login" onClick={handleLogin} />

        <div className="links">
          <span onClick={() => navigate("/login")}>User Login</span>
        </div>
      </div>
    </div>
  );
}