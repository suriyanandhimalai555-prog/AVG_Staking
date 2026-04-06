import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import API from "../../utils/api";
import { toast } from "react-hot-toast";
import Logo from "../../assets/logo.png";

const Topbar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ ONLY USE SUMMARY (single source of truth)
        const [profileRes, summaryRes] = await Promise.all([
          API.get("/users/me"),
          API.get("/withdrawals/summary"),
        ]);

        setUser(profileRes.data);

        // ✅ USE NET VALUES ONLY
        const roi = Number(summaryRes.data.roi || 0);
        const direct = Number(summaryRes.data.directReferral || 0);
        const level = Number(summaryRes.data.level || 0);

        const totalWallet = roi + direct + level;

        setWallet(totalWallet);

      } catch (err) {
        console.error("Topbar fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    toast.success("Logged out successfully 👋");

    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  return (
    <div className="utb-container">

      {/* LEFT */}
      <div className="utb-left">
        <div className="ut-brand">
          <img src={Logo} width={40} alt="logo" />
          <h2 className="utb-app-name">AVG</h2>
        </div>
      </div>

      {/* RIGHT */}
      <div className="utb-right">

        <div className="utb-user-info">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p className="utb-username">
                {user?.name || "User"}
              </p>

              <p className="utb-referral">
                Referral Code: {user?.user_code || "N/A"}
              </p>

              {/* ✅ CORRECT WALLET */}
              <p className="utb-wallet">
                Wallet Balance: ${wallet.toFixed(2)}
              </p>
            </>
          )}
        </div>

        <button
          className="utb-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
};

export default Topbar;