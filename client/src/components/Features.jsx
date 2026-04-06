import React from "react";
// import "./Features.css";
import { FaDollarSign, FaLock, FaChartLine, FaChartBar, FaWallet, FaMoneyBillWave, FaCheck } from "react-icons/fa";

const Features = () => {
  return (
    <section className="features-section">

      <div className="features-container">

        <h2 className="features-title">
          <span>AVG</span> FEATURES
        </h2>

        <p className="features-subtitle">
          Experience next-level staking with real-time rewards, dynamic dashboards,
          and secure crypto management.
        </p>

        {/* Top Features */}
        <div className="features-grid">

          <div className="feature-card">
            <FaDollarSign className="icon green"/>
            <h3>Instant Rewards</h3>
            <p>Watch your staking rewards grow in real-time.</p>
          </div>

          <div className="feature-card">
            <FaLock className="icon red"/>
            <h3>Secure & Transparent</h3>
            <p>Multi-layer encryption + blockchain-powered ledger.</p>
          </div>

          <div className="feature-card">
            <FaChartLine className="icon yellow"/>
            <h3>Flexible Plans</h3>
            <p>Choose from multiple staking options with dynamic APY.</p>
          </div>

          <div className="feature-card">
            <FaChartBar className="icon pink"/>
            <h3>Interactive Dashboard</h3>
            <p>Animated charts with 3D hover effects.</p>
          </div>

        </div>


        {/* How it work */}
        <h3 className="how-title">
          How It <span>Work</span>
        </h3>

        <div className="features-grid">

          <div className="feature-card">
            <FaWallet className="icon blue"/>
            <h3>Deposit Crypto</h3>
            <p>Add your crypto to start staking instantly.</p>
          </div>

          <div className="feature-card">
            <FaMoneyBillWave className="icon green2"/>
            <h3>Stake Instantly</h3>
            <p>Your funds are secured in a dynamic staking pool.</p>
          </div>

          <div className="feature-card">
            <FaDollarSign className="icon purple"/>
            <h3>Earn Rewards</h3>
            <p>Watch rewards grow in real-time visually.</p>
          </div>

          <div className="feature-card">
            <FaCheck className="icon yellow"/>
            <h3>Withdraw Anytime</h3>
            <p>Access your staked assets anytime.</p>
          </div>

        </div>

      </div>

    </section>
  );
};

export default Features;