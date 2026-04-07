import React, { useEffect, useState } from "react";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import API from "../utils/api";
import { FaTrophy } from "react-icons/fa";

const UserRewardClaims = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await API.get("/ranks/claims/user");
      setClaims(res.data || []);
    } catch (err) {
      console.error("Claim fetch error:", err);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  return (
    <div className="userRewardLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="userRewardPage">
          <div className="userRewardHeader">
            <div>
              <h2>Reward Claims</h2>
              <p>Track your monthly reward payouts</p>
            </div>
          </div>

          {loading ? (
            <div className="rewardEmpty">Loading...</div>
          ) : claims.length === 0 ? (
            <div className="rewardEmpty">No reward claims available</div>
          ) : (
            claims.map((claim, index) => {
              const isClosed = claim.claim_status === "closed";

              return (
                <div className="rewardCard" key={index}>
                  <div className="rewardCardTop">
                    <div className="rewardTitleBlock">
                      <FaTrophy className="rewardIcon" />
                      <div>
                        <h3>{claim.reward}</h3>
                        <p>Target: ₹{claim.target_amount}</p>
                      </div>
                    </div>

                    <div
                      className={`rewardStatus ${
                        isClosed ? "failed" : "success"
                      }`}
                    >
                      {isClosed ? "Closed" : "Active"}
                    </div>
                  </div>

                  <div style={{ marginBottom: "15px" }}>
                    <p>
                      <strong>Monthly Amount:</strong> ₹{claim.monthly_amount}
                    </p>
                    <p>
                      <strong>Start Date:</strong> {claim.start_date}
                    </p>
                    <p>
                      <strong>Total Months:</strong> {claim.months_count}
                    </p>
                  </div>

                  <div className="rewardTableWrap">
                    <table className="rewardTable">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Transaction ID</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {claim.claim_months?.map((m, i) => {
                          const monthStatus = m.status || "pending";
                          const displayStatus =
                            isClosed && monthStatus === "pending"
                              ? "stopped"
                              : monthStatus;

                          return (
                            <tr key={i}>
                              <td>{m.month_no}</td>
                              <td>
                                {m.due_date
                                  ? new Date(m.due_date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      }
                                    )
                                  : "-"}
                              </td>
                              <td>₹{m.amount}</td>
                              <td>{m.transaction_id || "-"}</td>
                              <td>
                                <span
                                  className={`statusBadge ${
                                    displayStatus === "completed"
                                      ? "success"
                                      : displayStatus === "stopped"
                                      ? "failed"
                                      : "pending"
                                  }`}
                                >
                                  {displayStatus === "completed"
                                    ? "Completed"
                                    : displayStatus === "stopped"
                                    ? "Stopped"
                                    : "Pending"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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

export default UserRewardClaims;