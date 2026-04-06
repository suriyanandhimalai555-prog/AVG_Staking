import { Navigate, Outlet } from "react-router-dom";

const UserRoute = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // ❌ Not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ❌ Not user
  if (role !== "user") {
    return <Navigate to="/dashboard" replace />;
  }

  // ✅ Allowed
  return <Outlet />;
};

export default UserRoute;