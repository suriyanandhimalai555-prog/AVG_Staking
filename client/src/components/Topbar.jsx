import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiLogOut, FiMenu } from "react-icons/fi";

const Topbar = ({ onMenuClick }) => {
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
    <header className="sticky top-0 z-30 h-[70px] border-b border-white/5 bg-[#070b1e]/80 backdrop-blur-md relative overflow-hidden">
      {/* Soft premium radial ambient glow behind content */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Mobile Toggle & Brand Text */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white shadow-md transition duration-200 hover:bg-white/10 active:scale-95"
            aria-label="Open menu"
          >
            <FiMenu className="text-lg" />
          </button>

          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:block">
              Welcome back
            </p>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white mt-0.5">
              Admin Dashboard
            </h1>
          </div>
        </div>

        {/* Right Side: Action Control Items */}
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-red-950/40 transition duration-200 active:scale-95"
            onClick={handleLogout}
            type="button"
          >
            <FiLogOut className="text-sm sm:text-base" />
            <span>Logout</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Topbar;