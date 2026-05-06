import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getUserRole } from "../services/authService";
import { auth } from "../services/firebase"; // adjust if different

export default function AdminProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      const role = await getUserRole(user.uid);

      if (role === "admin") {
        setIsAdmin(true);
      }

      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (!isAdmin) {
    return <Navigate to="/admin-login" />;// redirect to your login page
  }

  return children;
}