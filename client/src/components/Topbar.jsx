import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FiLogOut, FiUser, FiMenu } from "react-icons/fi";

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
    <header className="sticky top-0 z-30 h-[76px] border-b border-white/10 bg-[#050816]/95 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="md:hidden flex justify-center h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition hover:bg-white/10"
            aria-label="Open menu"
          >
            <FiMenu className="text-xl" />
          </button>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-400">Welcome back</p>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              Admin Dashboard
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-[0_8px_20px_rgba(59,130,246,0.35)]">
              <FiUser className="text-lg" />
            </div>

            <div className="leading-tight">
              <span className="block text-sm font-semibold text-white">
                Admin
              </span>
              <span className="block text-sm font-bold text-emerald-400">
                ₹0.00
              </span>
            </div>
          </div> */}

          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(239,68,68,0.25)] transition hover:brightness-110 sm:px-5"
            onClick={handleLogout}
            type="button"
          >
            <FiLogOut className="text-base" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;