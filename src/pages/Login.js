import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { loginUser, googleLogin, getUserRole } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // ✅ Route after validation
  const handleRoleRouting = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  // 🔐 LOGIN WITH EMAIL
  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      const role = await getUserRole(res.user.uid);

      console.log("Selected:", isAdmin ? "admin" : "user");
      console.log("Database Role:", role);

      // 🔴 MAIN FIX (role validation)
      if ((isAdmin && role !== "admin") || (!isAdmin && role !== "user")) {
        alert(`Access Denied! You are registered as ${role}`);
        return;
      }

      handleRoleRouting(role);

    } catch (error) {
      alert(error.message);
    }
  };

  // 🔐 GOOGLE LOGIN
  const handleGoogle = async () => {
    try {
      const res = await googleLogin();
      const role = await getUserRole(res.user.uid);

      console.log("Selected:", isAdmin ? "admin" : "user");
      console.log("Database Role:", role);

      // 🔴 SAME FIX HERE
      if ((isAdmin && role !== "admin") || (!isAdmin && role !== "user")) {
        alert(`Access Denied! You are registered as ${role}`);
        return;
      }

      handleRoleRouting(role);

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <h1 className="main-headline">Digital Marketing Analytics</h1>

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
          {isAdmin ? "Admin Login 👑" : "User Login 👤"}
        </h2>

        <div className="input-group">
          <Input type="email" placeholder="Email" onChange={setEmail} />
          <Input type="password" placeholder="Password" onChange={setPassword} />
        </div>

        <div className="button-group">
          <Button title="Login" onClick={handleLogin} />
          <Button title="Login with Google" onClick={handleGoogle} />
        </div>

        <div className="links">
          <span onClick={() => navigate("/register")}>Create Account</span>
          <span onClick={() => navigate("/forgot")}>Forgot Password?</span>
        </div>
      </div>
    </div>
  );
}