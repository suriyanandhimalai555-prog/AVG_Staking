import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaUserCheck,
  FaUserTimes,
  FaMoneyBillWave,
  FaArrowDown,
  FaArrowUp,
  FaChartLine,
  FaLayerGroup,
  FaWallet,
  FaTicketAlt
} from "react-icons/fa";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [divisor, setDivisor] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      try {
        const [dashboardRes, divRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_APP_BASE_URL}/api/users/staking-divisor`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setData(dashboardRes.data);
        setDivisor(divRes.data.divisor);
      } catch (error) {
        toast.error("Failed to load dashboard statistics");
      }
    };

    fetchDashboard();
  }, []);

  const updateDivisor = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/users/staking-divisor`,
        { divisor },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Divisor updated successfully");
    } catch (error) {
      toast.error("Failed to update divisor");
    }
  };

  if (!data) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-slate-400 font-medium">
        <div className="animate-pulse tracking-wide">Loading Dashboard Summary...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b1e] p-4 sm:p-6 lg:p-8 text-white space-y-8 rounded-2xl shadow-xl">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">Overview of your account activity</p>
      </div>

      {/* USERS METRICS */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Users</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="Total Users" value={data.users.total} icon={<FaUsers />} glowColor="rgba(147,51,234,0.15)" iconBg="bg-purple-500/10" iconColor="text-purple-400" />
          <Card title="Active Users" value={data.users.active} icon={<FaUserCheck />} glowColor="rgba(34,197,94,0.15)" iconBg="bg-green-500/10" iconColor="text-green-400" />
          <Card title="Inactive Users" value={data.users.inactive} icon={<FaUserTimes />} glowColor="rgba(244,63,94,0.15)" iconBg="bg-rose-500/10" iconColor="text-rose-400" />
        </div>
      </div>

      {/* TRANSACTIONS SECTION */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Transactions Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Deposits Overview" icon={<FaArrowDown className="text-emerald-400" />}>
            <SmallCard title="Total Deposits" value={data.deposits.total_count} />
            <SmallCard title="Total Amount" value={`$${data.deposits.total_amount}`} highlight />
            <SmallCard title="Today Deposits" value={data.deposits.today_count} />
            <SmallCard title="Today Amount" value={`$${data.deposits.today_amount}`} highlight />
          </Section>

          <Section title="Withdraw Overview" icon={<FaArrowUp className="text-rose-400" />}>
            <SmallCard title="Count" value={data.withdrawals.total_count} />
            <SmallCard title="Amount" value={`$${data.withdrawals.total_amount}`} highlight />
            <SmallCard title="Pending" value={data.withdrawals.pending} isWarning={data.withdrawals.pending > 0} />
            <SmallCard title="Withdraw Fee" value="$0.00" />
          </Section>
        </div>
      </div>

      {/* INCOME METRICS */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Income Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card title="ROI Income" value={`$${data.income.roi}`} icon={<FaChartLine />} glowColor="rgba(34,197,94,0.15)" iconBg="bg-green-500/10" iconColor="text-green-400" />
          <Card title="Level Income" value={`$${data.income.level}`} icon={<FaLayerGroup />} glowColor="rgba(147,51,234,0.15)" iconBg="bg-purple-500/10" iconColor="text-purple-400" />
          <Card title="Direct Income" value={`$${data.income.direct}`} icon={<FaWallet />} glowColor="rgba(6,182,212,0.15)" iconBg="bg-cyan-500/10" iconColor="text-cyan-400" />
        </div>
      </div>

      {/* SUPPORT & SETTINGS SPLIT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SUPPORT TICKETS CARD BOX */}
        <div className="xl:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Support Tickets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card title="Open Tickets" value={data.tickets.open} icon={<FaTicketAlt />} glowColor="rgba(59,130,246,0.15)" iconBg="bg-blue-500/10" iconColor="text-blue-400" />
            <Card title="In Progress" value={data.tickets.progress} icon={<FaMoneyBillWave />} glowColor="rgba(234,179,8,0.15)" iconBg="bg-yellow-500/10" iconColor="text-yellow-400" />
            <Card title="Closed Tickets" value={data.tickets.closed} icon={<FaUserCheck />} glowColor="rgba(34,197,94,0.15)" iconBg="bg-green-500/10" iconColor="text-green-400" />
          </div>
        </div>

        {/* AVG STAKING SETTINGS PANEL */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">AVG Staking Settings</h2>
          <div className="border border-white/5 bg-[#111936] rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[156px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 font-medium">Staking Divisor</p>
                <h3 className="text-2xl font-bold mt-1 text-white tracking-tight">{divisor || "0.0"}</h3>
              </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <input
                type="number"
                step="0.001"
                value={divisor}
                onChange={(e) => setDivisor(e.target.value)}
                className="flex-1 bg-[#090f26] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                placeholder="0.00"
              />
              <button
                onClick={updateDivisor}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition duration-200 shadow-md shadow-purple-950/50 whitespace-nowrap"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

/* SUB-COMPONENTS */

const Card = ({ title, value, icon, glowColor, iconBg, iconColor }) => {
  return (
    <div 
      className="relative border border-white/5 bg-[#111936] rounded-2xl p-5 flex items-center justify-between overflow-hidden shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: `0 10px 30px -10px ${glowColor || 'rgba(0,0,0,0.3)'}` }}
    >
      <div className="space-y-1 z-10">
        <p className="text-xs font-medium text-slate-400 tracking-wide">{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} text-lg z-10`}>
        {icon}
      </div>
    </div>
  );
};

const Section = ({ title, children, icon }) => {
  return (
    <div className="border border-white/5 bg-[#111936] rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
        <span className="text-base">{icon}</span>
        <h3 className="font-semibold text-sm text-slate-200 tracking-wide">{title}</h3>
      </div>
      <div className="grid grid-cols-2 gap-3.5">{children}</div>
    </div>
  );
};

const SmallCard = ({ title, value, highlight, isWarning }) => {
  return (
    <div className="bg-[#090f26] border border-white/[0.03] rounded-xl p-3 space-y-1">
      <p className="text-[11px] font-medium text-slate-500 tracking-wide">{title}</p>
      <h4 className={`text-base font-bold tracking-tight ${
        isWarning ? "text-amber-400" : highlight ? "text-indigo-400" : "text-white"
      }`}>
        {value}
      </h4>
    </div>
  );
};