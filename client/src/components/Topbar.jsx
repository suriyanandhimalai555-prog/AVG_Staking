import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiLogOut, FiUser } from "react-icons/fi";

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    toast.success("Logged out successfully 👋");

    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title-wrap">
          {/* <h1 className="topbar-title">Dashboard</h1> */}
          {/* <p className="topbar-subtitle">Admin control panel</p> */}
        </div>
      </div>

      <div className="topbar-right">
        <div className="admin-card">
          <div className="admin-avatar">
            <FiUser />
          </div>

          <div className="admin-meta">
            <span className="admin-name">Admin</span>
            <span className="wallet">
               ₹0.00
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout} type="button">
          <FiLogOut />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;