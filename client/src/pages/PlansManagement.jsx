import React, { useState, useEffect } from 'react';
import axios from "axios";

const API = "http://localhost:5000/api/plans";

const PlansManagement = () => {

  const [plansData, setPlansData] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    roi: '',
    directReferral: '',
    ceilingLimit: '',
    investmentRange: '',
    status: 'active'
  });

  // ✅ POPUP
  const showPopupMessage = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // ✅ FETCH PLANS
  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlansData(res.data);

    } catch (err) {
      console.error(err);
      showPopupMessage("Failed to fetch plans");
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // ✅ TOGGLE STATUS
  const togglePlanStatus = async (planId) => {
    try {
      const token = localStorage.getItem("token");

      const plan = plansData.find(p => p.id === planId);
      const newStatus = plan.status === 'active' ? 'inactive' : 'active';

      await axios.put(
        `${API}/${planId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const updatedData = plansData.map(p =>
        p.id === planId ? { ...p, status: newStatus } : p
      );

      setPlansData(updatedData);

      showPopupMessage(`Plan ${plan.name} ${newStatus}`);

    } catch (err) {
      console.error(err);
      showPopupMessage("Status update failed");
    }
  };

  // ✅ EDIT
  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      roi: plan.roi,
      directReferral: plan.direct_referral,
      ceilingLimit: plan.ceiling_limit,
      investmentRange: plan.investment_range,
      status: plan.status
    });
    setModalType('edit');
    setShowModal(true);
  };

  // ✅ CREATE
  const handleCreate = () => {
    setFormData({
      name: '',
      roi: '',
      directReferral: '',
      ceilingLimit: '',
      investmentRange: '',
      status: 'active'
    });
    setModalType('create');
    setShowModal(true);
  };

  // ✅ INPUT CHANGE
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ✅ SUBMIT (CREATE + EDIT)
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: formData.name,
        roi: formData.roi,
        directReferral: formData.directReferral,
        ceilingLimit: formData.ceilingLimit,
        investmentRange: formData.investmentRange,
        status: formData.status
      };

      if (modalType === 'create') {
        await axios.post(API, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });

        showPopupMessage('Plan created successfully');

      } else if (modalType === 'edit' && selectedPlan) {

        await axios.put(
          `${API}/${selectedPlan.id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        showPopupMessage(`Plan ${formData.name} updated successfully`);
      }

      setShowModal(false);
      setSelectedPlan(null);

      // ✅ REFRESH DATA
      fetchPlans();

    } catch (err) {
      console.error(err);
      showPopupMessage("Action failed");
    }
  };

  // ================= UI (UNCHANGED) =================

  const renderModal = () => {
    if (!showModal) return null;

    return (
      <div className="plans-modal-overlay">
        <div className="plans-modal">
          <div className="plans-modal-header">
            <h3>{modalType === 'create' ? 'Create New Plan' : 'Edit Plan'}</h3>
            <button className="plans-modal-close" onClick={() => setShowModal(false)}>×</button>
          </div>

          <div className="plans-modal-body">

            <div className="plans-form-group">
              <label>Plan Name</label>
              <input name="name" value={formData.name} onChange={handleInputChange} />
            </div>

            <div className="plans-form-group">
              <label>ROI</label>
              <input name="roi" value={formData.roi} onChange={handleInputChange} />
            </div>

            <div className="plans-form-group">
              <label>Direct Referral</label>
              <input name="directReferral" value={formData.directReferral} onChange={handleInputChange} />
            </div>

            <div className="plans-form-group">
              <label>Ceiling Limit</label>
              <input name="ceilingLimit" value={formData.ceilingLimit} onChange={handleInputChange} />
            </div>

            <div className="plans-form-group">
              <label>Investment Range</label>
              <input name="investmentRange" value={formData.investmentRange} onChange={handleInputChange} />
            </div>

            <div className="plans-form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

          </div>

          <div className="plans-modal-footer">
            <button className="plans-modal-btn cancel" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="plans-modal-btn confirm" onClick={handleSubmit}>
              {modalType === 'create' ? 'Create Plan' : 'Save Changes'}
            </button>
          </div>

        </div>
      </div>
    );
  };

  const renderPopup = () => {
    if (!showPopup) return null;
    return <div className="plans-popup">{popupMessage}</div>;
  };

  return (
    <div className="plans-container">

      <div className="plans-header">
        <div>
          <h1 className="plans-title">Plans Management</h1>
          <p className="plans-subtitle">Investment Plans Overview</p>
        </div>
        <button className="plans-create-btn" onClick={handleCreate}>
          + Create Plan
        </button>
      </div>

      <div className="plans-grid">
        {plansData.map((plan) => (
          <div key={plan.id} className="plan-card">

            <div className="plan-card-header">
              <h2 className="plan-name">{plan.name}</h2>
              <button className="plan-edit-btn" onClick={() => handleEdit(plan)}>✎</button>
            </div>

            <div className="plan-details">
              <div className="plan-detail-item">
                <span>ROI</span>
                <span>{plan.roi}</span>
              </div>

              <div className="plan-detail-item">
                <span>Direct Referral</span>
                <span>{plan.direct_referral}</span>
              </div>

              <div className="plan-detail-item">
                <span>Ceiling Limit</span>
                <span>{plan.ceiling_limit}</span>
              </div>

              <div className="plan-detail-item">
                <span>Investment Range</span>
                <span>{plan.investment_range}</span>
              </div>

              <div className="plan-detail-item">
                <span>Status</span>
                <button
                  className={`plan-status-toggle ${plan.status}`}
                  onClick={() => togglePlanStatus(plan.id)}
                >
                  <span className="toggle-slider"></span>
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {renderModal()}
      {renderPopup()}

    </div>
  );
};

export default PlansManagement;