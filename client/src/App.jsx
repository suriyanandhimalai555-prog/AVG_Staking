import { BrowserRouter as Router, Routes, Route, Navigate  } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./pages/ScrollToTop";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

import Home from "./pages/Home";
import Dashboard from "./components/Dashboard";

import Users from "./pages/Users";
import Referral from "./pages/Referral";
import Bank from "./pages/Bank";

import DepositTransactions from "./pages/DepositTransactions";
import WithdrawTransactions from "./pages/WithdrawTransactions";
import AllTransactions from "./pages/AllTransactions";

import ROIEarnings from "./pages/ROIEarnings";
import DirectEarnings from "./pages/DirectEarnings";
import LevelEarnings from "./pages/LevelEarnings";

import PlansManagement from "./pages/PlansManagement";
import ActivePlans from "./pages/ActivePlans";
import RankRewards from "./pages/RankRewards";
import RewardClaims from "./pages/RewardClaims";

import LevelConfig from "./pages/Config-level";
import LevelUnlockConfig from "./pages/LevelUnlock";
import RankConfig from "./pages/Rank";

import Profile from "./pages/Profile";
import SupportTicket from "./pages/SupportTicket";

import AdminRoute from "./routes/AdminRoute";
import UserRoute from "./routes/UserRoute";

// user dashboard
import UserDashboard from "./pages/UserDashboard";
import AllPlans from "./pages/AllPlans";
import Portfolio from "./pages/Portfolio";
import UserDeposit from "./pages/UserDeposit";
import UserWithdraw from "./pages/UserWithdraw";
import UserTransaction from "./pages/UserTransaction";
import UserROI from "./pages/UserROI";
import UserDirect from "./pages/UserDirect";
import UserLevel from "./pages/UserLevel";
import MyNetwork from "./pages/MyNetwork";
import MyReffral from "./pages/MyReffral";
import UserProfile from "./pages/UserProfile";
import UserSupportTicket from "./pages/UserSupportTicket";
import UserBank from "./pages/UserBank";
import UserReward from "./pages/UserReward";
import UserRewardClaims from "./pages/UserRewardClaims";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import Otp from "./pages/Otp";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>

        {/* <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<Otp />} /> */}

        {/* <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Signup />} />
        <Route path="/auth/otp" element={<Otp />} />

        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/signup" element={<Navigate to="/auth/register" replace />} />
        <Route path="/otp" element={<Navigate to="/auth/otp" replace />} /> */}
        {/* PUBLIC WEBSITE */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/auth/register" element={<Home />} />
        </Route>

        {/* DASHBOARD (PROTECTED) */}
        <Route element={<AdminRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>

            <Route index element={<Dashboard />} />

            {/* USER MANAGEMENT */}
            <Route path="users" element={<Users />} />
            <Route path="referral" element={<Referral />} />
            <Route path="bank" element={<Bank />} />

            <Route path="plans" element={<PlansManagement />} />
            <Route path="activeplans" element={<ActivePlans />} />
            <Route path="rewards" element={<RankRewards />} />
            <Route path="reward-claims" element={<RewardClaims />} />

            {/* Transaction */}
            <Route path="deposit" element={<DepositTransactions />} />
            <Route path="withdraw" element={<WithdrawTransactions />} />
            <Route path="all" element={<AllTransactions />} />

            {/* Earnings */}
            <Route path="roi" element={<ROIEarnings />} />
            <Route path="direct" element={<DirectEarnings />} />
            <Route path="level" element={<LevelEarnings />} />

            {/* Configuration */}
            <Route path="config-level" element={<LevelConfig />} />
            <Route path="config-unlock" element={<LevelUnlockConfig />} />
            <Route path="config-rank" element={<RankConfig />} />

            {/* Account */}
            <Route path="profile" element={<Profile />} />
            <Route path="support" element={<SupportTicket />} />

          </Route>
        </Route>

        <Route element={<UserRoute />}>

          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/all-plans" element={<AllPlans />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/user-deposit" element={<UserDeposit />} />
          <Route path="/user-withdraw" element={<UserWithdraw />} />
          <Route path="/user-transaction" element={<UserTransaction />} />
          <Route path="/user-roi" element={<UserROI />} />
          <Route path="/user-direct" element={<UserDirect />} />
          <Route path="/user-level" element={<UserLevel />} />
          <Route path="/referrals" element={<MyReffral />} />
          <Route path="/network" element={<MyNetwork />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/user-support" element={<UserSupportTicket />} />
          <Route path="/user-bank" element={<UserBank />} />
          <Route path="/user-rewards" element={<UserReward />} />
          <Route path="/user-monthly-claims" element={<UserRewardClaims />} />
        </Route>

      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#fff",
            borderRadius: "10px",
            padding: "12px 16px",
          },
        }}
      />

    </Router>
  );
}

export default App;