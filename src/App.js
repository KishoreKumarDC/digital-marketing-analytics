import { BrowserRouter, Routes, Route } from "react-router-dom";
import UserLogin from "./pages/UserLogin";
import AdminLogin from "./pages/AdminLogin";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Routes */}
        <Route path="/" element={<UserLogin />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Other */}
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* User Dashboard (optional protect later) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* 🔒 Protected Admin */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;