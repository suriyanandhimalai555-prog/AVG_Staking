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
} from "react-icons/fi";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

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
      "/dashboard/reward-claims"
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

  const toggleMenu = (menu) => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const go = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;
  const isSubActive = (paths) => paths.includes(location.pathname);

  return (
    <>
      <button
        className="hamburger"
        onClick={() => setMobileOpen(true)}
        type="button"
        aria-label="Open sidebar"
      >
        ☰
      </button>

      <div
        className={`sidebar-overlay ${mobileOpen ? "show" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <img src={icon} alt="AVG logo" className="brand-logo" />
            <div>
              <h2 className="brand-name">AVG</h2>
              <p className="brand-subtitle">Admin Panel</p>
            </div>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setMobileOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-scroll">
          <p className="section-label">MAIN</p>

          <div
            className={`menu-item ${isActive("/dashboard") ? "active" : ""}`}
            onClick={() => go("/dashboard")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiHome />
            </span>
            <span className="menu-text">Dashboard</span>
          </div>

          <p className="section-label">MANAGEMENT</p>

          <div
            className={`menu-item ${isSubActive(sections.user) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("user")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiUsers />
            </span>
            <span className="menu-text">User Management</span>
            <span className="menu-arrow">
              {openMenu === "user" ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>

          {openMenu === "user" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/users") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/users")}
                role="button"
                tabIndex={0}
              >
                Users
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/referral") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/referral")}
                role="button"
                tabIndex={0}
              >
                Referral
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/bank") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/bank")}
                role="button"
                tabIndex={0}
              >
                Bank
              </div>
            </div>
          )}

          <div
            className={`menu-item ${isActive("/dashboard/plans") ? "active" : ""}`}
            onClick={() => go("/dashboard/plans")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiLayers />
            </span>
            <span className="menu-text">Plans</span>
          </div>

          <div
            className={`menu-item ${isActive("/dashboard/activeplans") ? "active" : ""
              }`}
            onClick={() => go("/dashboard/activeplans")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiCreditCard />
            </span>
            <span className="menu-text">Active Plans</span>
          </div>

          <p className="section-label">HISTORY</p>

          <div
            className={`menu-item ${isSubActive(sections.transactions) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("transactions")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiFileText />
            </span>
            <span className="menu-text">Transactions</span>
            <span className="menu-arrow">
              {openMenu === "transactions" ? (
                <FiChevronDown />
              ) : (
                <FiChevronRight />
              )}
            </span>
          </div>

          {openMenu === "transactions" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/deposit") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/deposit")}
                role="button"
                tabIndex={0}
              >
                Deposit
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/withdraw") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/withdraw")}
                role="button"
                tabIndex={0}
              >
                Withdraw
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/all") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/all")}
                role="button"
                tabIndex={0}
              >
                All Transactions
              </div>
            </div>
          )}

          <div
            className={`menu-item ${isSubActive(sections.earnings) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("earnings")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiTrendingUp />
            </span>
            <span className="menu-text">Earnings</span>
            <span className="menu-arrow">
              {openMenu === "earnings" ? (
                <FiChevronDown />
              ) : (
                <FiChevronRight />
              )}
            </span>
          </div>

          {openMenu === "earnings" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/roi") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/roi")}
                role="button"
                tabIndex={0}
              >
                ROI
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/direct") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/direct")}
                role="button"
                tabIndex={0}
              >
                Direct
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/level") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/level")}
                role="button"
                tabIndex={0}
              >
                Level
              </div>
            </div>
          )}

          <div
            className={`menu-item ${isSubActive(sections.rewards) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("rewards")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiAward />
            </span>
            <span className="menu-text">Reward</span>
            <span className="menu-arrow">
              {openMenu === "rewards" ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>

          {openMenu === "rewards" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/rewards") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/rewards")}
                role="button"
                tabIndex={0}
              >
                Rewards
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/reward-claims") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/reward-claims")}
                role="button"
                tabIndex={0}
              >
                Monthly Claims
              </div>
            </div>
          )}

          <p className="section-label">CONFIGURATION</p>

          <div
            className={`menu-item ${isSubActive(sections.config) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("config")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiSettings />
            </span>
            <span className="menu-text">Configuration</span>
            <span className="menu-arrow">
              {openMenu === "config" ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>

          {openMenu === "config" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/config-level") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/config-level")}
                role="button"
                tabIndex={0}
              >
                Level
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/config-unlock") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/config-unlock")}
                role="button"
                tabIndex={0}
              >
                Level Unlock
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/config-rank") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/config-rank")}
                role="button"
                tabIndex={0}
              >
                Rank
              </div>
            </div>
          )}

          <p className="section-label">ACCOUNT</p>

          <div
            className={`menu-item ${isSubActive(sections.account) ? "active parent-active" : ""
              }`}
            onClick={() => toggleMenu("account")}
            role="button"
            tabIndex={0}
          >
            <span className="menu-icon">
              <FiUser />
            </span>
            <span className="menu-text">Account</span>
            <span className="menu-arrow">
              {openMenu === "account" ? <FiChevronDown /> : <FiChevronRight />}
            </span>
          </div>

          {openMenu === "account" && (
            <div className="submenu">
              <div
                className={`submenu-item ${isActive("/dashboard/profile") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/profile")}
                role="button"
                tabIndex={0}
              >
                My Profile
              </div>

              <div
                className={`submenu-item ${isActive("/dashboard/support") ? "active" : ""
                  }`}
                onClick={() => go("/dashboard/support")}
                role="button"
                tabIndex={0}
              >
                Support Ticket
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;