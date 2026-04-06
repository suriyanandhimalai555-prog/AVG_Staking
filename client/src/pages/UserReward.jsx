import React, { useEffect, useState } from "react";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import API from "../utils/api";
import { FaTrophy } from "react-icons/fa";

const UserReward = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rewards, setRewards] = useState([]); // ✅ changed
  const [loading, setLoading] = useState(false);

  // ✅ FETCH ALL REWARDS
  const fetchReward = async () => {
    try {
      setLoading(true);

      const res = await API.get("/ranks/user");

      setRewards(res.data || []); // ✅ multiple rewards

    } catch (err) {
      console.error("Reward fetch error:", err);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReward();
  }, []);

  return (
    <div className="userRewardLayout">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

      <div className="main">
        <Topbar isOpen={isOpen} setIsOpen={setIsOpen} />

        <div className="userRewardPage">
          {/* HEADER */}
          <div className="userRewardHeader">
            <div>
              <h2>Rewards</h2>
              <p>Track your reward milestone progress</p>
            </div>
          </div>

          {/* BODY */}
          {loading ? (
            <div className="rewardEmpty">Loading...</div>
          ) : rewards.length === 0 ? (
            <div className="rewardEmpty">No reward available</div>
          ) : (
            rewards.map((reward, index) => (
              <div className="rewardCard" key={index}>

                {/* TOP */}
                <div className="rewardCardTop">
                  <div className="rewardTitleBlock">
                    <FaTrophy className="rewardIcon" />
                    <div>
                      <h3>{reward.reward}</h3>
                      <p>Target: ₹{reward.target_amount}</p>
                    </div>
                  </div>

                  <div
                    className={`rewardStatus ${
                      reward.status === "approved"
                        ? "success"
                        : reward.status === "rejected"
                        ? "failed"
                        : "pending"
                    }`}
                  >
                    {reward.status === "approved"
                      ? "Completed"
                      : reward.status === "rejected"
                      ? "Rejected"
                      : "In Progress"}
                  </div>
                </div>

                {/* TABLE */}
                <div className="rewardTableWrap">
                  <table className="rewardTable">
                    <thead>
                      <tr>
                        <th>Target Amount</th>
                        <th>Reward</th>
                        <th>Timeline</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td>₹{reward.target_amount}</td>
                        <td>{reward.reward}</td>

                        {/* TIMELINE */}
                        <td>
                          <div className="timelineBox">
                            {reward.timeline?.map((t, i) => (
                              <div
                                key={i}
                                className={`timelineItem ${
                                  t.achieved ? "done" : ""
                                }`}
                              >
                                <div className="circle">
                                  {t.achieved ? "✔" : ""}
                                </div>

                                <div className="timelineText">
                                  <strong>{t.percent}%</strong> - ₹{t.amount}
                                  <br />

                                  {t.achieved ? (
                                    <span className="completed">
                                      Completed by {t.by}
                                    </span>
                                  ) : (
                                    <span className="pendingText">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`statusBadge ${
                              reward.status === "approved"
                                ? "success"
                                : reward.status === "rejected"
                                ? "failed"
                                : "pending"
                            }`}
                          >
                            {reward.status === "approved"
                              ? "Approved"
                              : reward.status === "rejected"
                              ? "Rejected"
                              : "Pending"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* PROGRESS */}
                <div className="progressBox">
                  <div className="progressHead">
                    <span>Progress</span>
                    <span>
                      ₹{reward.progress} / ₹{reward.target_amount}
                    </span>
                  </div>

                  <div className="progressBar">
                    <div
                      className="progressFill"
                      style={{
                        width: `${
                          (reward.progress / reward.target_amount) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserReward;