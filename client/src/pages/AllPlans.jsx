import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/user/UserSidebar";
import Topbar from "../components/user/UserTopbar";
import { toast } from "react-hot-toast";

const API = `${import.meta.env.VITE_APP_BASE_URL}/api/plans/all`;

const AllPlans = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planAmount, setPlanAmount] = useState("");
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ✅ FETCH PLANS
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlans(res.data);

    } catch (err) {
      console.error("Fetch plans error:", err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleBuyPlan = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!selectedPlan || !planAmount) {
        return toast.error("Please enter amount ⚠️");
      }

      if (Number(planAmount) <= 0) {
        return toast.error("Amount must be greater than 0 ❌");
      }

      // 🔄 Optional loading toast
      const loadingToast = toast.loading("Processing purchase...");

      await axios.post(
        `${import.meta.env.VITE_APP_BASE_URL}/api/user-plans/buy`,
        {
          planId: selectedPlan.id || selectedPlan.plan_id,
          amount: Number(planAmount),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.dismiss(loadingToast);
      toast.success("Plan purchased successfully 🎉");

      setIsPlanModalOpen(false);
      setPlanAmount("");

      // better than reload
      fetchPlans();

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Purchase failed ❌"
      );

      console.error("BUY ERROR:", err.response?.data || err.message);
    }
  };

  // ✅ OPEN MODAL
  const openModal = (plan) => {
    setSelectedPlan(plan);
    setIsPlanModalOpen(true);
  };

  return (
    <div className="usrAllPlans__layoutWrapper">

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <div className="main">

        <Topbar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        <div className="usrAllPlans__contentArea">

          <h2 className="usrAllPlans__pageTitle">Plans</h2>

          {/* ✅ DYNAMIC PLANS */}
          <div className="usrAllPlans__plansGrid">

            {plans.map((plan) => (
              <div key={plan.id} className="usrAllPlans__planCard">

                <div className="usrAllPlans__planBadge">
                  {plan.name}
                </div>

                <ul className="usrAllPlans__planFeatureList">
                  <li><span>✔</span> ROI <b>{plan.roi}</b></li>
                  <li><span>✔</span> Direct Referral <b>{plan.direct_referral}</b></li>
                  <li><span>✔</span> Ceiling Limit <b>{plan.ceiling_limit}</b></li>
                  <li><span>✔</span> Investment Range <b>{plan.investment_range}</b></li>
                </ul>

                <button
                  className="usrAllPlans__primaryActionBtn"
                  onClick={() => openModal(plan)}
                >
                  Buy Now
                </button>

              </div>
            ))}

          </div>

        </div>
      </div>

      {/* ✅ MODAL */}
      {isPlanModalOpen && selectedPlan && (
        <div className="usrAllPlans__modalOverlay">

          <div className="usrAllPlans__modalContainer">

            <div className="usrAllPlans__modalHeader">
              <h3 className="usrAllPlans__modalTitle">
                Buy Plan: {selectedPlan.name}
              </h3>

              <button
                className="usrAllPlans__modalCloseBtn"
                onClick={() => setIsPlanModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="usrAllPlans__modalBody">

              <div className="usrAllPlans__formGroup">
                <label>Plan Name</label>
                <input value={selectedPlan.name} disabled />
              </div>

              <div className="usrAllPlans__formGroup">
                <label>Request Amount</label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                />
              </div>

            </div>

            <div className="usrAllPlans__modalFooter">

              <button
                className="usrAllPlans__secondaryBtn"
                onClick={() => setIsPlanModalOpen(false)}
              >
                Cancel
              </button>

              <button className="usrAllPlans__confirmBtn"
                onClick={handleBuyPlan}
              >
                Buy Now
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default AllPlans;