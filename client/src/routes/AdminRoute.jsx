import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/user-dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;