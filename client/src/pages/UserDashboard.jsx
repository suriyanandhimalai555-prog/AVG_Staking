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
  FaTrophy,
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

const AvgAchieversCard = () => {
  const [slides, setSlides] = useState([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        setLoadingSlides(true);
        const res = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/banner-slides/public`
        );
        setSlides(res.data || []);
      } catch (error) {
        console.error("Hero banner fetch error:", error);
        setSlides([]);
      } finally {
        setLoadingSlides(false);
      }
    };

    fetchSlides();
  }, []);

  if (loadingSlides) {
    return (
      <div className="mb-6 flex h-[300px] items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  if (!slides.length) return null;

  return (
    <section className="relative overflow-hidden px-0 py-0">
      <style>{`
        @keyframes avgScrollLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
        <span className="text-yellow-500"><FaTrophy /></span>
        <span>AVG Achievers</span>  
      </h1>

      <div className="overflow-hidden">
        <div
          className="flex gap-4 md:gap-6"
          style={{
            width: "max-content",
            animation: "avgScrollLeft 15s linear infinite",
          }}
        >
          {[...slides, ...slides].map((item, index) => (
            <div
              key={`top-${index}`}
              className="
                flex
                w-[92vw]
                sm:w-[560px]
                lg:w-[650px]
                overflow-hidden
                rounded-[20px]
                lg:rounded-[28px]
                bg-white
                border
                border-slate-100
                shadow-[0_15px_40px_rgba(0,0,0,0.12)]
                transition-all
                duration-500
                hover:-translate-y-2
                hover:shadow-[0_25px_60px_rgba(0,0,0,0.18)]
              "
            >
              <div
                className="
                  relative
                  w-[120px]
                  sm:w-[180px]
                  lg:w-[220px]
                  flex-shrink-0
                "
              >
                <img
                  src={item.imageUrl}
                  alt={item.username}
                  className="
                    h-full
                    min-h-[180px]
                    sm:min-h-[220px]
                    w-full
                    object-cover
                  "
                />

                <div
                  className="
                    absolute
                    left-2
                    top-2
                    rounded-full
                    bg-yellow-500
                    px-2
                    py-1
                    text-[10px]
                    sm:text-xs
                    font-bold
                    text-white
                  "
                >
                  🏆 ACHIEVER
                </div>
              </div>

              <div
                className="
                  flex
                  flex-1
                  flex-col
                  justify-center
                  p-3
                  sm:p-4
                  lg:p-5
                "
              >
                <span
                  className="
                    w-fit
                    rounded-full
                    bg-green-100
                    px-2
                    py-1
                    text-[10px]
                    sm:text-xs
                    font-semibold
                    text-green-700
                  "
                >
                  Target Completed
                </span>

                <h3
                  className="
                    mt-2
                    text-lg
                    sm:text-xl
                    lg:text-2xl
                    font-bold
                    text-slate-900
                    truncate
                  "
                >
                  {item.username}
                </h3>

                <p className="text-xs sm:text-sm text-slate-500">
                  AVG Elite Achiever
                </p>

                <div
                  className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-2
                    lg:gap-3
                  "
                >
                  <div
                    className="
                      rounded-lg
                      lg:rounded-xl
                      bg-slate-100
                      p-2
                      lg:p-3
                    "
                  >
                    <p className="text-[10px] sm:text-xs text-slate-500">
                      Target
                    </p>

                    <h4 className="mt-1 text-xs sm:text-sm lg:text-base font-bold text-slate-900">
                      ${Number(item.target_amount || 0).toLocaleString()}
                    </h4>
                  </div>

                  <div
                    className="
                      rounded-lg
                      lg:rounded-xl
                      bg-green-50
                      p-2
                      lg:p-3
                    "
                  >
                    <p className="text-[10px] sm:text-xs text-green-600">
                      Achieved
                    </p>

                    <h4 className="mt-1 text-xs sm:text-sm lg:text-base font-bold text-green-700">
                      ${Number(item.progress || 0).toLocaleString()}
                    </h4>
                  </div>
                </div>

                <div
                  className="
                    mt-2
                    rounded-lg
                    lg:rounded-xl
                    bg-amber-50
                    p-2
                    lg:p-3
                  "
                >
                  <p className="text-[10px] sm:text-xs text-amber-600">
                    Reward Earned
                  </p>

                  <h4
                    className="
                      mt-1
                      text-xs
                      sm:text-sm
                      lg:text-base
                      font-bold
                      text-slate-900
                      line-clamp-2
                    "
                  >
                    {item.reward}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
          <AvgAchieversCard />

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