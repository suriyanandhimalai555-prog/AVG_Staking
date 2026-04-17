import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTachometerAlt,
  FaLayerGroup,
  FaWallet,
  FaChevronRight,
  FaUser,
  FaNetworkWired,
  FaMoneyBillWave,
  FaTrophy
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import Logo from "../../assets/logo.png";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();

  const navigate = useNavigate();

  const handleLogout = () => {
    // clear auth data (adjust based on your app)
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // redirect to login
    navigate("/");
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // 🔥 Prevent scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  // 🔥 AUTO OPEN ONLY (NO ACTIVE)
  useEffect(() => {
    if (["/user-deposit", "/user-withdraw", "/user-transaction"].some(p => location.pathname.startsWith(p))) {
      setOpenMenu("transactions");
    }

    if (["/user-roi", "/user-direct", "/user-level"].some(p => location.pathname.startsWith(p))) {
      setOpenMenu("earnings");
    }

    if (["/referrals", "/network"].some(p => location.pathname.startsWith(p))) {
      setOpenMenu("network");
    }

    if (["/user-profile", "/user-support", "/user-bank"].some(p => location.pathname.startsWith(p))) {
      setOpenMenu("account");
    }
  }, [location.pathname]);

  // 🔥 MENU ITEM (ONLY ACTIVE IF DIRECT LINK)
  const MenuItem = ({ icon, label, to, hasDropdown, menuKey }) => {
    const isActive = to && location.pathname === to;

    return (
      <div
        className={`us-item ${isActive ? "us-active" : ""}`}
        onClick={() => {
          if (hasDropdown) {
            toggleMenu(menuKey);
          } else if (window.innerWidth < 768) {
            setIsOpen(false);
          }
        }}
      >
        {isActive && <div className="us-active-bar" />}

        <NavLink to={to || "#"} className="us-item-left">
          {icon}
          <span>{label}</span>
        </NavLink>

        {hasDropdown && (
          <FaChevronRight
            className={`us-arrow ${openMenu === menuKey ? "rotate" : ""}`}
          />
        )}
      </div>
    );
  };

  // 🔥 SUB ITEM (ONLY THIS SHOULD HIGHLIGHT)
  const SubItem = ({ label, to }) => {
    const isActive = location.pathname === to;

    return (
      <NavLink
        to={to}
        className={`us-subitem ${isActive ? "active-sub" : ""}`}
        onClick={() => window.innerWidth < 768 && setIsOpen(false)}
      >
        {label}
      </NavLink>
    );
  };

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`us-overlay ${isOpen ? "show" : ""}`}
        onClick={() => setIsOpen(false)}
      />

      <div className={`us-sidebar ${isOpen ? "open" : ""}`}>

        {/* CLOSE BTN */}
        <button className="us-close-btn" onClick={() => setIsOpen(false)}>
          ✕
        </button>

        {/* LOGO */}
        <div className="us-logo">
          <img src={Logo} alt="logo" />
          <h1>AVG</h1>
        </div>

        <div className="us-mobile-top">
          <button className="us-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* MAIN */}
        <p className="us-section">MAIN</p>
        <MenuItem icon={<FaTachometerAlt />} label="Dashboard" to="/user-dashboard" />

        {/* PLAN */}
        <p className="us-section">PLAN</p>
        <MenuItem icon={<FaLayerGroup />} label="All Plans" to="/all-plans" />
        <MenuItem icon={<FaWallet />} label="Portfolio" to="/portfolio" />

        {/* HISTORY */}
        <p className="us-section">HISTORY</p>

        <MenuItem
          icon={<FaMoneyBillWave />}
          label="Transactions"
          hasDropdown
          menuKey="transactions"
        />

        <div className={`us-dropdown ${openMenu === "transactions" ? "open" : ""}`}>
          <SubItem label="Deposit" to="/user-deposit" />
          <SubItem label="Withdraw" to="/user-withdraw" />
          <SubItem label="All Transactions" to="/user-transaction" />
        </div>

        <MenuItem
          icon={<FaLayerGroup />}
          label="Earnings"
          hasDropdown
          menuKey="earnings"
        />

        <div className={`us-dropdown ${openMenu === "earnings" ? "open" : ""}`}>
          <SubItem label="ROI Income" to="/user-roi" />
          <SubItem label="Direct Income" to="/user-direct" />
          <SubItem label="Level Income" to="/user-level" />
        </div>

        {/* NETWORK */}
        <p className="us-section">NETWORK</p>

        <MenuItem
          icon={<FaNetworkWired />}
          label="Network"
          hasDropdown
          menuKey="network"
        />

        <div className={`us-dropdown ${openMenu === "network" ? "open" : ""}`}>
          <SubItem label="My Referrals" to="/referrals" />
          <SubItem label="My Network" to="/network" />
        </div>

        {/* REWARD */}
        <p className="us-section">REWARD</p>

        <MenuItem
          icon={<FaTrophy />}
          label="Rewards"
          hasDropdown
          menuKey="rewards"
        />

        <div className={`us-dropdown ${openMenu === "rewards" ? "open" : ""}`}>
          <SubItem label="Rewards" to="/user-rewards" />
          <SubItem label="Monthly Claims" to="/user-monthly-claims" />
        </div>
        {/* <MenuItem icon={<FaTrophy />} label="Rewards" to="/user-rewards" /> */}

        {/* ACCOUNT */}
        <p className="us-section">ACCOUNT</p>

        <MenuItem
          icon={<FaUser />}
          label="Account"
          hasDropdown
          menuKey="account"
        />

        <div className={`us-dropdown ${openMenu === "account" ? "open" : ""}`}>
          <SubItem label="My Profile" to="/user-profile" />
          <SubItem label="Support Ticket" to="/user-support" />
          <SubItem label="Bank" to="/user-bank" />
        </div>
      </div>
    </>
  );
};

export default Sidebar;