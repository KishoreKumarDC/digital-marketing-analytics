import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { loginUser, googleLogin, getUserRole } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function UserLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Only USER routing
  const handleLogin = async () => {
    try {
      const res = await loginUser(email, password);
      const role = await getUserRole(res.user.uid);

      if (role !== "user") {
        alert(`Access Denied! You are registered as ${role}`);
        return;
      }

      navigate("/dashboard");

    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogle = async () => {
    try {
      const res = await googleLogin();
      const role = await getUserRole(res.user.uid);

      if (role !== "user") {
        alert(`Access Denied! You are registered as ${role}`);
        return;
      }

      navigate("/dashboard");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="login-container">
      <h1 className="main-headline">Digital Marketing Analytics</h1>

      <div className="glass-card">

        {/* ❌ REMOVED TOGGLE */}

        <h2 className="title-container">
  <span className="title-icon" style={{ color: "#ef4444" }}>
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
  </span>

  <span className="title-text">
    USER ACCESS
  </span>
</h2>

        <div className="input-group">
          <Input type="email" placeholder="Email" onChange={setEmail} />

          {/* Password field */}
          <div className="password-field-container" style={{ position: 'relative', width: '100%' }}>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              onChange={setPassword}
            />

            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                padding: '5px',
                zIndex: 10
              }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
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