import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import icon from "../assets/icon.png";
import {
  FiHome,
  FiUsers,
  FiChevronDown,
  FiChevronRight,
  FiCreditCard,
  FiSettings,
  FiUser,
  FiFileText,
  FiTrendingUp,
  FiAward,
  FiLayers,
  FiX,
} from "react-icons/fi";

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  const sections = {
    user: ["/dashboard/users", "/dashboard/referral", "/dashboard/bank"],
    transactions: ["/dashboard/deposit", "/dashboard/withdraw", "/dashboard/all"],
    earnings: ["/dashboard/roi", "/dashboard/direct", "/dashboard/level"],
    rewards: ["/dashboard/rewards", "/dashboard/reward-claims", "/dashboard/banner-image"],
    config: ["/dashboard/config-level", "/dashboard/config-unlock", "/dashboard/config-rank"],
    account: ["/dashboard/profile", "/dashboard/support"],
  };

  useEffect(() => {
    const currentPath = location.pathname;
    const activeSection = Object.entries(sections).find(([, paths]) =>
      paths.includes(currentPath)
    );
    if (activeSection) {
      setOpenMenu(activeSection[0]);
    }
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const go = (path) => {
    navigate(path);
    if (window.innerWidth < 768) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isSubActive = (paths) => paths.includes(location.pathname);

  const menuItemClass = (active, parentActive = false) => [
    "group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 text-sm font-medium",
    active || parentActive
      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/30 ring-1 ring-white/10"
      : "text-slate-400 hover:bg-white/5 hover:text-white",
  ].join(" ");

  const submenuClass = (active) => [
    "flex w-full items-center rounded-xl px-4 py-2 text-sm transition-all duration-200",
    active
      ? "bg-purple-500/10 text-purple-300 font-semibold"
      : "text-slate-400 hover:bg-white/5 hover:text-white",
  ].join(" ");

  return (
    <>
    <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/5 bg-[#070b1e] text-white transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.08),transparent_40%)]" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Header Brand Logo */}
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-inner">
                <img src={icon} alt="AVG logo" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">AVG</h2>
                <p className="text-xs text-slate-500">Admin Panel</p>
              </div>
            </div>

            <button
              className="md:hidden flex items-center justify-center h-8 w-8 rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close sidebar"
            >
              <FiX className="text-base" />
            </button>
          </div>

          {/* Navigation Menu Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 h-[calc(100vh-70px)] no-scrollbar">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Main
            </p>

            <button className={menuItemClass(isActive("/dashboard"))} onClick={() => go("/dashboard")} type="button">
              <FiHome className="text-lg" />
              <span>Dashboard</span>
            </button>

            <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Management
            </p>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.user) || openMenu === "user")}
                onClick={() => toggleMenu("user")}
                type="button"
              >
                <FiUsers className="text-lg" />
                <span className="flex-1">User Management</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "user" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>

              <div className={`grid transition-all duration-300 ${openMenu === "user" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/users"))} onClick={() => go("/dashboard/users")} type="button">Users</button>
                  <button className={submenuClass(isActive("/dashboard/referral"))} onClick={() => go("/dashboard/referral")} type="button">Referral</button>
                  <button className={submenuClass(isActive("/dashboard/bank"))} onClick={() => go("/dashboard/bank")} type="button">Bank</button>
                </div>
              </div>
            </div>

            <button className={`${menuItemClass(isActive("/dashboard/plans"))} mt-1`} onClick={() => go("/dashboard/plans")} type="button">
              <FiLayers className="text-lg" />
              <span>Plans</span>
            </button>

            <button className={`${menuItemClass(isActive("/dashboard/activeplans"))} mt-1`} onClick={() => go("/dashboard/activeplans")} type="button">
              <FiCreditCard className="text-lg" />
              <span>Active Plans</span>
            </button>

            <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              History
            </p>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.transactions) || openMenu === "transactions")}
                onClick={() => toggleMenu("transactions")}
                type="button"
              >
                <FiFileText className="text-lg" />
                <span className="flex-1">Transactions</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "transactions" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openMenu === "transactions" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/deposit"))} onClick={() => go("/dashboard/deposit")} type="button">Deposit</button>
                  <button className={submenuClass(isActive("/dashboard/withdraw"))} onClick={() => go("/dashboard/withdraw")} type="button">Withdraw</button>
                  <button className={submenuClass(isActive("/dashboard/all"))} onClick={() => go("/dashboard/all")} type="button">All Transactions</button>
                </div>
              </div>
            </div>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.earnings) || openMenu === "earnings")}
                onClick={() => toggleMenu("earnings")}
                type="button"
              >
                <FiTrendingUp className="text-lg" />
                <span className="flex-1">Earnings</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "earnings" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openMenu === "earnings" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/roi"))} onClick={() => go("/dashboard/roi")} type="button">ROI</button>
                  <button className={submenuClass(isActive("/dashboard/direct"))} onClick={() => go("/dashboard/direct")} type="button">Direct</button>
                  <button className={submenuClass(isActive("/dashboard/level"))} onClick={() => go("/dashboard/level")} type="button">Level</button>
                </div>
              </div>
            </div>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.rewards) || openMenu === "rewards")}
                onClick={() => toggleMenu("rewards")}
                type="button"
              >
                <FiAward className="text-lg" />
                <span className="flex-1">Reward</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "rewards" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openMenu === "rewards" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/rewards"))} onClick={() => go("/dashboard/rewards")} type="button">Rewards</button>
                  <button className={submenuClass(isActive("/dashboard/reward-claims"))} onClick={() => go("/dashboard/reward-claims")} type="button">Monthly Claims</button>
                  <button className={submenuClass(isActive("/dashboard/banner-image"))} onClick={() => go("/dashboard/banner-image")} type="button">Banner Image</button>
                </div>
              </div>
            </div>

            <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Configuration
            </p>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.config) || openMenu === "config")}
                onClick={() => toggleMenu("config")}
                type="button"
              >
                <FiSettings className="text-lg" />
                <span className="flex-1">Configuration</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "config" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openMenu === "config" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/config-level"))} onClick={() => go("/dashboard/config-level")} type="button">Level</button>
                  <button className={submenuClass(isActive("/dashboard/config-unlock"))} onClick={() => go("/dashboard/config-unlock")} type="button">Level Unlock</button>
                  <button className={submenuClass(isActive("/dashboard/config-rank"))} onClick={() => go("/dashboard/config-rank")} type="button">Rank</button>
                </div>
              </div>
            </div>

            <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
              Account
            </p>

            <div>
              <button
                className={menuItemClass(false, isSubActive(sections.account) || openMenu === "account")}
                onClick={() => toggleMenu("account")}
                type="button"
              >
                <FiUser className="text-lg" />
                <span className="flex-1">Account</span>
                <span className="text-slate-500 text-xs">
                  {openMenu === "account" ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openMenu === "account" ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0 pointer-events-none"}`}>
                <div className="overflow-hidden pl-4 border-l border-white/5 ml-6 space-y-1">
                  <button className={submenuClass(isActive("/dashboard/profile"))} onClick={() => go("/dashboard/profile")} type="button">My Profile</button>
                  <button className={submenuClass(isActive("/dashboard/support"))} onClick={() => go("/dashboard/support")} type="button">Support Ticket</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;