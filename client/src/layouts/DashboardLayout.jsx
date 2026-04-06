import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-area">
        <Topbar />

        <div className="content page-wrapper">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;