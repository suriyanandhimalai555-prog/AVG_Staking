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
    transactions: [
      "/dashboard/deposit",
      "/dashboard/withdraw",
      "/dashboard/all",
    ],
    earnings: ["/dashboard/roi", "/dashboard/direct", "/dashboard/level"],
    rewards: [
      "/dashboard/rewards",
      "/dashboard/reward-claims",
      "/dashboard/banner-image",
    ],
    config: [
      "/dashboard/config-level",
      "/dashboard/config-unlock",
      "/dashboard/config-rank",
    ],
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

  const menuItemClass = (active, parentActive = false) =>
    [
      "group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all duration-200",
      active || parentActive
        ? "bg-white/10 text-white ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
        : "text-slate-300 hover:bg-white/5 hover:text-white",
    ].join(" ");

  const submenuClass = (active) =>
    [
      "flex w-full items-center rounded-xl px-4 py-2.5 text-sm transition-all duration-200",
      active
        ? "bg-sky-500/15 text-sky-200"
        : "text-slate-400 hover:bg-white/5 hover:text-white",
    ].join(" ");

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-white/10 bg-gradient-to-b from-[#050816] to-[#060a19] text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.08),transparent_28%)]" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_20px_rgba(0,0,0,0.25)]">
                <img
                  src={icon}
                  alt="AVG logo"
                  className="h-9 w-9 object-contain"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight">AVG</h2>
                <p className="text-sm text-slate-400">Admin Panel</p>
              </div>
            </div>

            <button
              className="md:hidden flex justify-center h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close sidebar"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div
            className="
              flex-1 overflow-y-auto px-4 py-5
              [scrollbar-width:none]
              [-ms-overflow-style:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Main
            </p>

            <button
              className={menuItemClass(isActive("/dashboard"))}
              onClick={() => go("/dashboard")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiHome />
              </span>
              <span className="text-sm font-medium">Dashboard</span>
            </button>

            <p className="mb-3 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Management
            </p>

            <button
              className={menuItemClass(
                false,
                isSubActive(sections.user) || openMenu === "user"
              )}
              onClick={() => toggleMenu("user")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiUsers />
              </span>
              <span className="flex-1 text-sm font-medium">User Management</span>
              <span className="text-slate-400">
                {openMenu === "user" ? <FiChevronDown /> : <FiChevronRight />}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "user"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/users"))}
                    onClick={() => go("/dashboard/users")}
                    type="button"
                  >
                    Users
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/referral"))}
                    onClick={() => go("/dashboard/referral")}
                    type="button"
                  >
                    Referral
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/bank"))}
                    onClick={() => go("/dashboard/bank")}
                    type="button"
                  >
                    Bank
                  </button>
                </div>
              </div>
            </div>

            <button
              className={`${menuItemClass(isActive("/dashboard/plans"))} mt-2`}
              onClick={() => go("/dashboard/plans")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiLayers />
              </span>
              <span className="text-sm font-medium">Plans</span>
            </button>

            <button
              className={`${menuItemClass(isActive("/dashboard/activeplans"))} mt-2`}
              onClick={() => go("/dashboard/activeplans")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiCreditCard />
              </span>
              <span className="text-sm font-medium">Active Plans</span>
            </button>

            <p className="mb-3 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              History
            </p>

            <button
              className={menuItemClass(
                false,
                isSubActive(sections.transactions) || openMenu === "transactions"
              )}
              onClick={() => toggleMenu("transactions")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiFileText />
              </span>
              <span className="flex-1 text-sm font-medium">Transactions</span>
              <span className="text-slate-400">
                {openMenu === "transactions" ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "transactions"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/deposit"))}
                    onClick={() => go("/dashboard/deposit")}
                    type="button"
                  >
                    Deposit
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/withdraw"))}
                    onClick={() => go("/dashboard/withdraw")}
                    type="button"
                  >
                    Withdraw
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/all"))}
                    onClick={() => go("/dashboard/all")}
                    type="button"
                  >
                    All Transactions
                  </button>
                </div>
              </div>
            </div>

            <button
              className={`${menuItemClass(
                false,
                isSubActive(sections.earnings) || openMenu === "earnings"
              )} mt-2`}
              onClick={() => toggleMenu("earnings")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiTrendingUp />
              </span>
              <span className="flex-1 text-sm font-medium">Earnings</span>
              <span className="text-slate-400">
                {openMenu === "earnings" ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "earnings"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/roi"))}
                    onClick={() => go("/dashboard/roi")}
                    type="button"
                  >
                    ROI
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/direct"))}
                    onClick={() => go("/dashboard/direct")}
                    type="button"
                  >
                    Direct
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/level"))}
                    onClick={() => go("/dashboard/level")}
                    type="button"
                  >
                    Level
                  </button>
                </div>
              </div>
            </div>

            <button
              className={`${menuItemClass(
                false,
                isSubActive(sections.rewards) || openMenu === "rewards"
              )} mt-2`}
              onClick={() => toggleMenu("rewards")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiAward />
              </span>
              <span className="flex-1 text-sm font-medium">Reward</span>
              <span className="text-slate-400">
                {openMenu === "rewards" ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "rewards"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/rewards"))}
                    onClick={() => go("/dashboard/rewards")}
                    type="button"
                  >
                    Rewards
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/reward-claims"))}
                    onClick={() => go("/dashboard/reward-claims")}
                    type="button"
                  >
                    Monthly Claims
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/banner-image"))}
                    onClick={() => go("/dashboard/banner-image")}
                    type="button"
                  >
                    Banner Image
                  </button>
                </div>
              </div>
            </div>

            <p className="mb-3 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Configuration
            </p>

            <button
              className={menuItemClass(
                false,
                isSubActive(sections.config) || openMenu === "config"
              )}
              onClick={() => toggleMenu("config")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiSettings />
              </span>
              <span className="flex-1 text-sm font-medium">Configuration</span>
              <span className="text-slate-400">
                {openMenu === "config" ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "config"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/config-level"))}
                    onClick={() => go("/dashboard/config-level")}
                    type="button"
                  >
                    Level
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/config-unlock"))}
                    onClick={() => go("/dashboard/config-unlock")}
                    type="button"
                  >
                    Level Unlock
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/config-rank"))}
                    onClick={() => go("/dashboard/config-rank")}
                    type="button"
                  >
                    Rank
                  </button>
                </div>
              </div>
            </div>

            <p className="mb-3 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Account
            </p>

            <button
              className={menuItemClass(
                false,
                isSubActive(sections.account) || openMenu === "account"
              )}
              onClick={() => toggleMenu("account")}
              type="button"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-sky-300 transition group-hover:bg-sky-500/10">
                <FiUser />
              </span>
              <span className="flex-1 text-sm font-medium">Account</span>
              <span className="text-slate-400">
                {openMenu === "account" ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                openMenu === "account"
                  ? "mt-2 grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden pl-4">
                <div className="ml-6 border-l border-white/10 py-2 pl-4 space-y-1">
                  <button
                    className={submenuClass(isActive("/dashboard/profile"))}
                    onClick={() => go("/dashboard/profile")}
                    type="button"
                  >
                    My Profile
                  </button>
                  <button
                    className={submenuClass(isActive("/dashboard/support"))}
                    onClick={() => go("/dashboard/support")}
                    type="button"
                  >
                    Support Ticket
                  </button>
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