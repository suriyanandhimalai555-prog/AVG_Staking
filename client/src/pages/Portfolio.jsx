import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";

const Portfolio = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/user-plans/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlans(res.data || []);
    } catch (err) {
      console.error("Portfolio fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return (
    <div className="usrPortfolio__layoutWrapper">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="main">
        <Topbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <h2 className="usrPortfolio__pageTitle">My Portfolio</h2>

        <div className="usrPortfolio__contentArea">
          {loading ? (
            <p>Loading...</p>
          ) : plans.length === 0 ? (
            <p>No active plans</p>
          ) : (
            plans.map((plan, index) => {
  const deposit = Number(plan.amount || 0);
  const dailyROI = Number(plan.daily_roi || 0);

  const roiIncome = Number(plan.roi_income || 0);
  const directIncome = Number(plan.direct_income || 0);
  const levelIncome = Number(plan.level_income || 0);

  const maxReturn = Number(plan.max_return || 0);

  // ✅ HARD CAP (MAIN FIX)
  const rawTotal = roiIncome + directIncome + levelIncome;
  const totalEarned = Math.min(rawTotal, maxReturn);

  // ❌ REMOVE EXTRA PROFIT COMPLETELY
  const extraEarned = 0;

  // ✅ PROGRESS BASED ON CAPPED VALUE
  const totalProgress =
    maxReturn > 0
      ? ((totalEarned / maxReturn) * 100).toFixed(2)
      : "0.00";

  const roiProgress =
    maxReturn > 0
      ? Math.min((roiIncome / maxReturn) * 100, 100).toFixed(2)
      : "0.00";

  const directProgress =
    maxReturn > 0
      ? Math.min((directIncome / maxReturn) * 100, 100).toFixed(2)
      : "0.00";

  const levelProgress =
    maxReturn > 0
      ? Math.min((levelIncome / maxReturn) * 100, 100).toFixed(2)
      : "0.00";

              return (
                <div key={index} className="usrPortfolio__card">
                  <div className="usrPortfolio__iconWrapper">📄</div>

                  <h3 className="usrPortfolio__planTitle">
                    {plan.plan_name}
                  </h3>

                  <div className="usrPortfolio__statsRow">
                    <div className="usrPortfolio__statBox">
                      <p>Deposit</p>
                      <h4>${deposit}</h4>
                    </div>

                    <div className="usrPortfolio__statBox">
                      <p>Daily ROI</p>
                      <h4>${dailyROI.toFixed(2)}</h4>
                    </div>
                  </div>

                  <div className="usrPortfolio__progressSection">
                    <div className="usrPortfolio__progressHeader">
                      <span>ROI Progress</span>
                      <span className="usrPortfolio__progressAmount">
                        ${roiIncome.toFixed(2)}
                      </span>
                    </div>

                    <div className="usrPortfolio__progressBar">
                      <div
                        className="usrPortfolio__progressFill gradient-roi"
                        style={{ width: `${roiProgress}%` }}
                      ></div>
                    </div>

                    <p className="usrPortfolio__progressText">
                      {roiProgress}% completed
                    </p>
                  </div>

                  <div className="usrPortfolio__progressSection">
                    <div className="usrPortfolio__progressHeader">
                      <span>Direct Referral Income</span>
                      <span className="usrPortfolio__progressAmount">
                        ${directIncome.toFixed(2)}
                      </span>
                    </div>

                    <div className="usrPortfolio__progressBar">
                      <div
                        className="usrPortfolio__progressFill gradient-direct"
                        style={{ width: `${directProgress}%` }}
                      ></div>
                    </div>

                    <p className="usrPortfolio__progressText">
                      {directProgress}% completed
                    </p>
                  </div>

                  <div className="usrPortfolio__progressSection">
                    <div className="usrPortfolio__progressHeader">
                      <span>Level Income</span>
                      <span className="usrPortfolio__progressAmount">
                        ${levelIncome.toFixed(2)}
                      </span>
                    </div>

                    <div className="usrPortfolio__progressBar">
                      <div
                        className="usrPortfolio__progressFill gradient-level"
                        style={{ width: `${levelProgress}%` }}
                      ></div>
                    </div>

                    <p className="usrPortfolio__progressText">
                      {levelProgress}% completed
                    </p>
                  </div>

                  <div className="usrPortfolio__totalIncome">
                    Total Earned:{" "}
                    <strong>
                      ${totalEarned.toFixed(2)} / ${maxReturn.toFixed(2)}
                    </strong>
                  </div>

                  {/* {extraEarned > 0 && (
                    <div className="usrPortfolio__extraIncome">
                      Extra Profit: <strong>${extraEarned.toFixed(2)}</strong>
                    </div>
                  )} */}

                  <div className="usrPortfolio__footer">
                    <div className="usrPortfolio__footerRow">
                      <span>Purchased</span>
                      <span>
                        {plan.created_at
                          ? new Date(plan.created_at).toLocaleDateString()
                          : "-"}
                      </span>
                    </div>

                    <div className="usrPortfolio__footerRow">
                      <span>Status</span>
                      <span className="usrPortfolio__statusBadge">
                        {totalEarned >= maxReturn ? "Completed" : "Ongoing"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;