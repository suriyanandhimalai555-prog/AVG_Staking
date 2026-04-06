import React from "react";
// import "./plan.css";

const Plan = () => {
  return (
    <section className="plan-section">
      <div className="plan-container">

        <div className="plan-badge">Signature Investment Plan</div>

        <h2 className="plan-title">AVG Super</h2>

        <p className="plan-subtitle">
          A professionally structured staking plan designed for consistent
          daily returns with defined risk control.
        </p>

        <div className="plan-content">

          <div className="plan-cards">

            <div className="plan-card">
              <p>Daily ROI</p>
              <h3 className="yellow">0.5%</h3>
            </div>

            <div className="plan-card">
              <p>Profit Ceiling</p>
              <h3 className="cyan">2x</h3>
            </div>

            <div className="plan-card">
              <p>Minimum Investment</p>
              <h3 className="green">$100</h3>
            </div>

            <div className="plan-card">
              <p>Maximum Investment</p>
              <h3 className="red">$100000</h3>
            </div>

          </div>

          <div className="income-box">
            <h3>Earn Daily Passive Income</h3>

            <p>
              Your funds are allocated into a controlled staking pool that
              produces predictable daily rewards with a predefined maximum
              return ceiling.
            </p>

            <div className="referral">
              Referral Bonus
              <span>+5%</span>
            </div>
          </div>

        </div>

        <div className="plan-bottom">

          <h3>Why Investors Choose This Plan</h3>

          <div className="features">

            <div>✓ Guaranteed daily ROI distribution</div>
            <div>✓ Defined profit ceiling for capital safety</div>
            <div>✓ Transparent reward calculations</div>
            <div>✓ Instant referral income eligibility</div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default Plan;