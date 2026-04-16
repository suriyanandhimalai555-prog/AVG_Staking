import React, { useState, useEffect } from "react";
import axios from "axios";

import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

import {
  FaChartLine,
  FaLayerGroup,
  FaWallet,
  FaMoneyBill,
  FaArrowDown,
  FaArrowUp,
  FaUsers,
  FaBolt,
} from "react-icons/fa";

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="card">
      <div className="card-left">
        <p className="card-title">{title}</p>
        <h3>{value}</h3>
      </div>
      <div className="card-icon">{icon}</div>
    </div>
  );
};

const UserDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);

  // ✅ WALLET (AFTER DEDUCTION)
  const [wallet, setWallet] = useState({
    roi: 0,
    level: 0,
    direct: 0,
  });

  // ✅ EARNINGS (FULL TOTAL)
  const [earnings, setEarnings] = useState({
    roi: 0,
    level: 0,
    direct: 0,
  });

  const [stats, setStats] = useState({
    staking: 0,
    totalDeposits: 0,
    totalDepositAmount: 0,
    todayDeposits: 0,
    todayDepositAmount: 0,
    totalWithdraw: 0,
    totalWithdrawAmount: 0,
    todayWithdraw: 0,
    todayWithdrawAmount: 0,
    directCount: 0,
    teamCount: 0,
    teamBusiness: 0,
    todayBusiness: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const [
          summaryRes,
          withdrawRes,
          referralsRes,
          networkRes,
          depositRes,
          teamBusinessRes,
        ] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/withdrawals/my`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/my-referrals`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/my-network`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/my-deposits-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/my-team-business`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // ✅ WALLET (DEDUCTED)
        setWallet({
          roi: summaryRes.data.roi || 0,
          level: summaryRes.data.level || 0,
          direct: summaryRes.data.direct || 0,
        });

        // ✅ EARNINGS (TOTAL)
        setEarnings({
          roi: summaryRes.data.roiTotal || 0,
          level: summaryRes.data.levelTotal || 0,
          direct: summaryRes.data.directTotal || 0,
        });

        // ✅ WITHDRAW STATS
        const withdrawals = withdrawRes.data || [];
        const today = new Date().toDateString();

        const totalWithdraw = withdrawals.length;
        const totalWithdrawAmount = withdrawals.reduce(
          (sum, w) => sum + Number(w.amount || 0),
          0
        );

        const todayWithdrawList = withdrawals.filter(
          (w) => new Date(w.created_at).toDateString() === today
        );

        const todayWithdraw = todayWithdrawList.length;
        const todayWithdrawAmount = todayWithdrawList.reduce(
          (sum, w) => sum + Number(w.amount || 0),
          0
        );

        // ✅ DEPOSITS
        const totalDeposits = Number(depositRes.data.total_count || 0);
        const totalDepositAmount = Number(depositRes.data.total_amount || 0);
        const todayDeposits = Number(depositRes.data.today_count || 0);
        const todayDepositAmount = Number(depositRes.data.today_amount || 0);

        // ✅ REFERRALS
        const directCount = referralsRes.data.length;

        // ✅ TEAM COUNT
        const calcCount = (node) => {
          if (!node || !node.children) return 0;

          let count = node.children.length;
          node.children.forEach((child) => {
            count += calcCount(child);
          });

          return count;
        };

        const teamCount = calcCount(networkRes.data);

        const totalStaking = Number(depositRes.data.total_staking || 0);

        // ✅ FINAL STATS
        setStats({
          staking: totalStaking,
          totalDeposits,
          totalDepositAmount,
          todayDeposits,
          todayDepositAmount,
          totalWithdraw,
          totalWithdrawAmount,
          todayWithdraw,
          todayWithdrawAmount,
          directCount,
          teamCount,
          teamBusiness: teamBusinessRes.data.teamBusiness,
          todayBusiness: teamBusinessRes.data.todayBusiness,
        });

      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div className="dashboard">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="content">
          <h2 className="page-title">Dashboard</h2>
          <span>Overview of your account activity</span>

          {/* ✅ WALLET BALANCE */}
          <h4 className="section-title">Wallet Balance</h4>
          <div className="grid grid-3">
            <StatCard title="ROI Income" value={`$${wallet.roi}`} icon={<FaChartLine />} />
            <StatCard title="Level Income" value={`$${wallet.level}`} icon={<FaLayerGroup />} />
            <StatCard title="Direct Income" value={`$${wallet.direct}`} icon={<FaWallet />} />
          </div>

          {/* ✅ EARNINGS (NO DEDUCTION) */}
          <h4 className="section-title">Earnings</h4>
          <div className="grid grid-4">
            <StatCard
              title="Total AVG Staking Balance"
              value={`${Number(stats.staking).toFixed(2)}`}
              icon={<FaMoneyBill />}
            />
            <StatCard title="ROI Income" value={`$${earnings.roi}`} icon={<FaChartLine />} />
            <StatCard title="Level Income" value={`$${earnings.level}`} icon={<FaLayerGroup />} />
            <StatCard title="Direct Income" value={`$${earnings.direct}`} icon={<FaWallet />} />
          </div>

          {/* TRANSACTIONS */}
          <h4 className="section-title">Transactions Overview</h4>
          <div className="grid grid-2">
            <div className="box">
              <div className="box-header">
                <h3>Deposits Overview</h3>
                <FaArrowDown />
              </div>

              <div className="mini-grid">
                <div className="mini-card"><p>Total Deposits</p><h4>{stats.totalDeposits}</h4></div>
                <div className="mini-card"><p>Total Amount</p><h4>${stats.totalDepositAmount}</h4></div>
                <div className="mini-card"><p>Today Deposits</p><h4>{stats.todayDeposits}</h4></div>
                <div className="mini-card"><p>Today Amount</p><h4>${stats.todayDepositAmount}</h4></div>
              </div>
            </div>

            <div className="box">
              <div className="box-header">
                <h3>Withdraw Overview</h3>
                <FaArrowUp />
              </div>

              <div className="mini-grid">
                <div className="mini-card"><p>Total Withdraw</p><h4>{stats.totalWithdraw}</h4></div>
                <div className="mini-card"><p>Total Amount</p><h4>${stats.totalWithdrawAmount}</h4></div>
                <div className="mini-card"><p>Today Withdraw</p><h4>{stats.todayWithdraw}</h4></div>
                <div className="mini-card"><p>Today Amount</p><h4>${stats.todayWithdrawAmount}</h4></div>
              </div>
            </div>
          </div>

          {/* TEAM */}
          <h4 className="section-title">Business & Team</h4>
          <div className="grid grid-4">
            <StatCard title="Direct Referrals" value={stats.directCount} icon={<FaUsers />} />
            <StatCard title="Team Count" value={stats.teamCount} icon={<FaUsers />} />
            <StatCard title="Team Business" value={`$${stats.teamBusiness}`} icon={<FaBolt />} />
            <StatCard title="Today Business" value={`$${stats.todayBusiness}`} icon={<FaBolt />} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;