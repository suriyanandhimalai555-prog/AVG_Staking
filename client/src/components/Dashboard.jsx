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

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/api/users/admin/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchDashboard();
  }, []);

  if (!data) return <div className="dash-loading">Loading...</div>;

  return (
    <div className="dash-container">
      <h1 className="dash-title">Dashboard</h1>
      <p className="dash-subtitle">Overview of your account activity</p>

      {/* USERS */}
      <h2 className="dash-section">Users</h2>
      <div className="dash-grid-3">
        <Card title="Total Users" value={data.users.total} icon={<FaUsers />} color="purple" />
        <Card title="Active Users" value={data.users.active} icon={<FaUserCheck />} color="green" />
        <Card title="Inactive Users" value={data.users.inactive} icon={<FaUserTimes />} color="pink" />
      </div>

      {/* TRANSACTIONS */}
      <h2 className="dash-section">Transactions Overview</h2>
      <div className="dash-grid-2">

        <Section title="Deposits Overview" icon={<FaArrowDown />}>
          <SmallCard title="Total Deposits" value={data.deposits.total_count} />
          <SmallCard title="Total Amount" value={`$${data.deposits.total_amount}`} />
          <SmallCard title="Today Deposits" value={data.deposits.today_count} />
          <SmallCard title="Today Amount" value={`$${data.deposits.today_amount}`} />
        </Section>

        <Section title="Withdraw Overview" icon={<FaArrowUp />}>
          <SmallCard title="Count" value={data.withdrawals.total_count} />
          <SmallCard title="Amount" value={`$${data.withdrawals.total_amount}`} />
          <SmallCard title="Pending" value={data.withdrawals.pending} />
          <SmallCard title="Withdraw Fee" value="$0.00" />
        </Section>

      </div>

      {/* INCOME */}
      <h2 className="dash-section">Income</h2>
      <div className="dash-grid-3">
        <Card title="ROI Income" value={`$${data.income.roi}`} icon={<FaChartLine />} color="green" />
        <Card title="Level Income" value={`$${data.income.level}`} icon={<FaLayerGroup />} color="purple" />
        <Card title="Direct Income" value={`$${data.income.direct}`} icon={<FaWallet />} color="cyan" />
      </div>

      {/* SUPPORT */}
      <h2 className="dash-section">Support Tickets</h2>
      <div className="dash-grid-3">
        <Card title="Open Tickets" value={data.tickets.open} icon={<FaTicketAlt />} color="blue" />
        <Card title="In Progress" value={data.tickets.progress} icon={<FaMoneyBillWave />} color="yellow" />
        <Card title="Closed Tickets" value={data.tickets.closed} icon={<FaUserCheck />} color="green" />
      </div>
    </div>
  );
};

export default Dashboard;

/* COMPONENTS */

const Card = ({ title, value, color, icon }) => {
  return (
    <div className={`dash-card dash-${color}`}>
      <div>
        <p className="dash-card-title">{title}</p>
        <h3 className="dash-card-value">{value}</h3>
      </div>

      <div className="dash-icon-box">
        {icon}
      </div>
    </div>
  );
};

const SmallCard = ({ title, value }) => {
  return (
    <div className="dash-small-card">
      <p>{title}</p>
      <h4>{value}</h4>
    </div>
  );
};

const Section = ({ title, children, icon }) => {
  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <div className="dash-section-title">
          {icon}
          <h3>{title}</h3>
        </div>
      </div>
      <div className="dash-inner-grid">{children}</div>
    </div>
  );
};